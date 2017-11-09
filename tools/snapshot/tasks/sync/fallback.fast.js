module.exports = ( state, complete ) => {

  const async     = require('async'),
        Table     = require('ascii-table'),

        db        = require('../../models'),
        redis     = require('../../services/redis'),
        fallback  = require('../../utilities/local-pubkey'),
        util      = require('../../utilities'),
        web3      = require('../../services/web3').web3

  let intval,
      pks_found   = 0,
      count       = 0

  const get_uniques = ( next ) => {
    redis.keys('*', (err, addresses) => next( null, addresses ) )
  }

  const process_uniques = ( addresses, next ) => {
    async.eachSeries( addresses, (address, next_address) => {
      fallback( address, state.config.cache, (error, eos_key) => {
        if(error || !eos_key)
          db.Wallets
            .update(
              { fallback_error: error || "unknown" },
              { where : { address: address } }
            )
            .then( () => next_address() )
        else
          db.Wallets
            .update(
              {
                eos_key: eos_key,
                fallback: true,
                fallback_error: null,
                valid: true
              },
              { where : { address: address } }
            )
            .then( () => {
              redis.del(address);
              pks_found++
              next_address()
            })
      })
      count++
    },
    (err, result) => {
      clearInterval( intval )
      log()
      next()
    })
  }

  const log = () => {
    redis.keys('*', (err, addresses) => {

      let table = new Table(`Fast Fallback`),
          success_rate = Math.floor(pks_found/(addresses.length+pks_found)*100)

      table.addRow('Progress', `${Math.floor(count/addresses_total*100)}%`)
      table.addRow('PKs Found (fast)', pks_found)
      table.addRow('Pks Unfound (fast)', addresses.length)
      table.addRow('Found Rate (fast)', `${success_rate}%`)
      console.log( table.setAlign(0, Table.RIGHT).setAlign(1, Table.LEFT).render() )

    })
  }

  const periodic_log = () => {
    intval = setInterval( log, 30000 )
  }

  console.log('Fallback: Fast')

  async.waterfall([
      get_uniques,
      process_uniques
    ],
    () => setTimeout( () => complete(null, state), 5000 )
  )
}
