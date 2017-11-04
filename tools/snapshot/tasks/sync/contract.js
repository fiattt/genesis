let async          = require('async')
let table          = require('ascii-table')
let db             = require('../../models')

let util           = require('../../utilities')
let web3           = require('../../services/web3').web3
let web3Query      = require('../../services/web3').query
let bn             = require('bignumber.js')
let Iterator       = require('../../classes/Iterator')

let sync = {}

const Task      = require('../../classes/Task')

const bulkCreateConfig = {ignoreDuplicates: true}

let state,
    config

//TODO dry it up?

const syncContractLog = iterator => {
  console.log(iterator.args.table.render())
  console.log(`Started ${iterator.time_formatted().elapsed} ${iterator.time_formatted().average}`)
  iterator.args.table = null
}

const transfers = (iterator, next) => {
  let request = []
  web3Query.collection.transfers( iterator.from, iterator.to )
    .then( transfers => {
      let request = []
      if(transfers.length) {
        transfers.forEach( transfer => {
          request.push({
            tx_hash:      transfer.transactionHash,
            block_number: transfer.blockNumber,
            from:         transfer.returnValues.from,
            to:           transfer.returnValues.to,
            eos_amount:   new bn(transfer.returnValues.value).toFixed()
          })
        })
        iterator.args.table.addRow('Transfers', request.length)
        state.sync_contracts.transfers+=request.length
        db.Transfers.bulkCreate( request )
          .then( () => { next() })
          .catch(console.log)
      } else {
        next()
      }
    })
}

const buys = (iterator, next) => {
  let request = []
  web3Query.collection.buys( iterator.from, iterator.to )
    .then( buys => {
      let request = []
      if(buys.length) {
        buys.forEach( buy => {
          request.push({
            tx_hash:      buy.transactionHash,
            block_number: buy.blockNumber,
            address:      buy.returnValues.user,
            period:       buy.returnValues.window,
            eth_amount:   new bn(buy.returnValues.amount).toFixed()
          })
        })
        iterator.args.table.addRow('Buys', request.length)
        state.sync_contracts.buys+=request.length
        db.Buys.bulkCreate( request )
          .then( () => { next() })
          .catch(console.log)
      } else {
        next()
      }
    })
}

const claims = (iterator, next) => {
  let request = []
  web3Query.collection.claims( iterator.from, iterator.to )
    .then( claims => {
      let request = []
      if(claims.length) {
        claims.forEach( claim => {
          request.push({
              tx_hash:      claim.transactionHash,
              block_number: claim.blockNumber,
              address:      claim.returnValues.user,
              period:       claim.returnValues.window,
              eos_amount:   new bn(claim.returnValues.amount).toFixed()
            })
        })
        iterator.args.table.addRow('Claims', request.length)
        state.sync_contracts.claims+=request.length
        db.Claims.bulkCreate( request )
          .then( () => { next() })
          .catch(console.log)
      } else {
        next()
      }
    })
}

const registrations = (iterator, next) => {
  let request = []
  web3Query.collection.registrations( iterator.from, iterator.to )
    .then( registrations => {
      let request = []
      if(registrations.length) {
        registrations.forEach( registration => {
          request.push({
            tx_hash:      registration.transactionHash,
            block_number: registration.blockNumber,
            address:      registration.returnValues.user,
            eos_key:      registration.returnValues.key
          })
        })
        iterator.args.table.addRow('Registrations', request.length)
        state.sync_contracts.registrations+=request.length
        db.Registrations.bulkCreate( request, bulkCreateConfig )
          .then( () => { next() })
          .catch(console.log)
      } else {
        next()
      }
    })
}

const reclaimables = (iterator, next) => {
  let request = []
  web3Query.collection.reclaimables( iterator.from, iterator.to )
    .then( reclaimables => {
      let request = []
      if(reclaimables.length) {
        reclaimables.forEach( reclaimable => {
          let eos_amount = new bn(reclaimable.returnValues.value)
          if(eos_amount.gt(0)) {
            request.push({
              tx_hash:      reclaimable.transactionHash,
              block_number: reclaimable.blockNumber,
              address:      reclaimable.returnValues.from,
              eos_amount:   eos_amount.toFixed()
            })
          }
        });
        iterator.args.table.addRow('Reclaimables', request.length)
        state.sync_contracts.reclaimables+=request.length
        db.Reclaimables.bulkCreate( request, bulkCreateConfig )
          .then( () => { next() })
          .catch(console.log)
      } else {
        next()
      }
    })
}

const sync_contracts = complete => {
  console.log(`Syncing Contract State between block #${state.block_begin} & ${state.block_end}`)
  const sync_txs = iterator => {
    iterator.args.table = new table(`${iterator.from} ~> ${iterator.to}`),
    async.series([
        next => transfers( iterator, next ),
        next => buys( iterator, next ),
        next => claims( iterator, next ),
        next => registrations( iterator, next ),
        next => reclaimables( iterator, next )
    ], result => {
      syncContractLog(iterator)
      if(iterator.finish)
        console.log('finished'),
        iterator.onComplete()
      else
        iterator.next()
    })
  }

  const sync_options = {
    from: state.block_begin,
    max: state.block_end, //Buys are considered valid not by block, but by transaction timestamp so we add a buffer. This solves final discrepancy
    increment: 100,
    onComplete: (err, res) => { complete() }
  }

  let iterator = new Iterator( sync_txs, sync_options )
  iterator.iterate()
}

class TaskContract extends Task {

  setup(){
    this.state.sync_contracts = {
      buys:0,
      claims:0,
      registrations:0,
      transfers:0,
      reclaimables:0
    }
    state = this.state
    config = this.config
  }

  job(){
    this.setup()
    sync_contracts( () => {
      this.state = state
      this.finished()
    })
  }

}

module.exports = TaskContract
