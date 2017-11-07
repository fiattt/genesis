const async  = require('async')
const bn     = require('bignumber.js')

const Wallet = require('./Wallet')
const util = require('../utilities')

// const fallback = require('../tasks/misc/register-fallback')

//TODO move processing out of class, too much spaghetti around here
class WalletSnapshot extends Wallet {

  process_key( complete = () => {} ){
    this.maybe_fix_key()
    complete(null, this.eos_key)
  }

  process_balance_wallet( complete = () => {} ){
    util.balance.wallet_cumulative( this.address, this.transfers, balance => {
      this.balance.set( 'wallet', balance)
      complete( null, balance )
    })
  }

  process_balance_unclaimed( complete = () => {} ){
    util.balance.unclaimed( this.address, this.buys, this.claims, this.config.period, balance => {
      this.balance.set( 'unclaimed', balance )
      complete( null, balance )
    })
  }

  process_balance_reclaimed( complete = () => {} ){
    util.balance.reclaimed( this.address, this.reclaimables, balance => {
      this.balance.set( 'reclaimed', balance )
      complete( null, balance )
    })
  }

  process_balance_sum( complete = () => {} ){
    this.balance.sum()
    complete( null, this.balance.total )
  }

  process_balance_from_wei( complete = () => {} ){
    this.balance.from_wei()
    complete()
  }

  process_judgement( complete = () => {} ){
    this.valid() ? this.accept() : this.reject()
    if(util.misc.is_eos_public_key(this.eos_key) && !this.registered)
      console.log(this),
      process.exit()
    complete()
  }

  // process_fallback( complete ) {
  //   if(new bn(this.balance.total).gte(1) && this.register_error!==null)
  //     fallback( this.address, this.config.persist, (error, eos_key) => {
  //       if(error || !eos_key)
  //         this.fallback_error = error
  //       else
  //         this.fallback = true,
  //         this.eos_key  = eos_key,
  //         this.process_judgement()
  //       complete()
  //     })
  //   else
  //     complete()
  // }

  process_exempt(complete){
    const exempt = [CS_ADDRESS_CROWDSALE, CS_ADDRESS_TOKEN]
    if(!this.config.include_b1) exempt.push(CS_ADDRESS_B1)
    if(exempt.indexOf(this.address.toLowerCase()) > -1)
      this.accepted           = false,
      this.register_error     = 'exempt'
    complete()
  }

  process( callback ) {
    async.series([
      ( complete ) => this.process_key( complete ),
      ( complete ) => this.process_balance_wallet( complete ),
      ( complete ) => this.process_balance_unclaimed( complete ),
      ( complete ) => this.process_balance_reclaimed( complete ),
      ( complete ) => this.process_balance_sum( complete ),
      ( complete ) => this.process_balance_from_wei( complete ),
      ( complete ) => this.process_judgement( complete ),
      // ( complete ) => this.process_fallback( complete ),
      ( complete ) => this.process_exempt( complete )
    ],(err, result) => {
      this.balance.format()
      callback( this.json() )
    })
  }
}

module.exports = WalletSnapshot
