module.exports = ( state, complete ) => {

  const async     = require('async')
  const db        = require('../../models')
  const redis     = require('../../services/redis')

  const fallback  = require('../../utilities/register-fallback')
  const util      = require('../../utilities')
  const web3      = require('../../services/web3').web3

  let addresses,
      pks_discovered

  const get_uniques = ( next ) => {
    redis.keys('*', (err, addresses) => next( null, addresses ) )
  }

  const process_uniques = ( addresses, next ) => {
    async.eachSeries( addresses, (address, next_address) => {
      fallback( address, state.config.persist, (error, eos_key) => {
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
              pks_discovered++
              next_address()
            })
      })
    },
    (err, result) => {
      console.log('Processed all addresses')
      next()
    })
  }

  async.waterfall([
    get_uniques,
    process_uniques
  ], () => complete(null, state) )

}
