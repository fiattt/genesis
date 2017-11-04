let Table          = require('ascii-table')
let async          = require('async')
let bn              = require('bignumber.js')

const Task         = require('../../classes/Task')
let util           = require('../../utilities')
let helper         = require('../../helpers')
let query          = require('../../queries')

let index          = 0
let table


class TaskWallet extends Task {

  new(address, next){
    let Wallet = require('../../classes/Wallet.Testnet')
    let wallet = new Wallet( address, this.config )
    next( null, wallet )
  }

  transfers(wallet, finished) {
    wallet.transfers = []

    const add = next => {
      query.address_transfers_in(wallet.address, this.state.begin_block, this.state.end_block)
        .then( results => {
          let _results = results.map( result => new bn(result.dataValues.eos_amount) )
          wallet.transfers = wallet.transfers.concat(_results)
          next()
        })
    }

    const subtract = next => {
      query.address_transfers_out(wallet.address, this.state.begin_block, this.state.end_block)
        .then( results => {
          let _results = results.map( result => new bn(result.dataValues.eos_amount).times(-1) )
          wallet.transfers = wallet.transfers.concat(_results)
          next()
        })
    }

    async.series([
      add,
      subtract
    ], () => { finished( null, wallet ) })
  }

  claims(wallet, finished) {
    // console.log('Wallet Claims')
    query.address_claims(wallet.address, this.state.begin_block, this.state.end_block)
      .then( results => {
        wallet.claims = new Array( CS_NUMBER_OF_PERIODS ).fill( false )
        results.forEach( result => {
          wallet.claims[ result.dataValues.period ] = true
        })
        finished( null, wallet )
      })
  }

  buys( wallet, next ) {
    query.address_buys(wallet.address, this.state.begin_block, this.state.end_block)
      .then( results => {
        wallet.buys = new Array( CS_NUMBER_OF_PERIODS ).fill( new bn(0) )
        results.forEach( result => {
          wallet.buys[ result.dataValues.period ] = wallet.buys[ result.dataValues.period ].plus( new bn(result.dataValues.eth_amount) )
        })
        next( null, wallet )
      })
  }

  reclaimables( wallet, next ) {
    query.address_reclaimables( wallet.address, this.state.begin_block, this.state.end_block )
      .then( results  => {
        if( results.length ) {
          wallet.reclaimables = results.map( reclaim => { return { address: wallet.address, value: reclaim.dataValues.eos_amount } } )
          console.log(wallet.reclaimables)
        }
        next( null, wallet )
      })
  }

  processing( wallet, next ) {
    wallet.process( json => {
      this.log_table_row( wallet )
      this.cache.push( json )
      next( null, wallet )
    })
  }

  save_or_continue(next_address, finished = false) {
    if(this.cache.length >= 50 || this.cache.length == this.state.total || finished )
      helper.address.bulk_upsert( this.cache )
        .then( () => {
          this.cache = new Array()
          this.log_table_render_and_reset()
          next_address()
        })
    else
      next_address()
  }

  setup(){
    this.cache = new Array()
    this.state.total = 0
  }

  job(){
    console.log('Syncing Wallets')
    helper.address.uniques( this.state.begin_block, this.state.end_block, uniques => {
      this.uniques = new Set(uniques)
      this.state.total = this.uniques.size
      this.log_table_reset()
      async.eachSeries( Array.from(uniques), (address, next_address) => {
        async.waterfall([
          (next)         => this.new(address, next),
          (wallet, next) => this.buys(wallet, next),
          (wallet, next) => this.claims(wallet, next),
          (wallet, next) => this.transfers(wallet, next),
          (wallet, next) => this.reclaimables(wallet, next),
          (wallet, next) => this.processing(wallet, next)
        ],
        (error, wallet) => this.save_or_continue(next_address))
      },
      (err, result) => {
        this.save_or_continue( () => { this.finished() }, true )
      })
    })
  }

  log_table_reset(){
    table = new Table(`${Math.round(index*50/this.uniques.size*100)}% [${index*50}/${this.uniques.size}] `)
    table.setHeading('A', 'V', 'F', 'ETH', 'EOS', 'In Wallet', 'Unclaimed', 'Reclaimed', 'Total', 'Error(s)')
  }

  log_table_render_and_reset(){
    index++
    console.log(table.render())
    this.log_table_reset()
  }

  log_table_row(wallet){
    table.addRow(
      (!wallet.accepted ? ` ` : `✓`),
      (wallet.register_error ? ` ` : `✓`),
      (!wallet.fallback ? ` ` : `✓`),
      wallet.address,
      wallet.eos_key,
      `${wallet.balance.wallet} EOS`,
      `${wallet.balance.unclaimed} EOS`,
      `${wallet.balance.reclaimed} EOS`,
      `${wallet.balance.total} EOS`,
      `${wallet.register_error ? wallet.register_error : ""} ${wallet.fallback_error ? wallet.fallback_error : ""}`
    )
  }


}

module.exports = TaskWallet
