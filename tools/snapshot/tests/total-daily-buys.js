// [sum(buys.eth_amount) == utility_contract.daily_buys]
// This verifies correct synchronization between contract and db, if this were wrong, it would not be noticed in supply levels, but would instead result in inaccurate user *unclaimed* balances in snapshot

module.exports = (state, callback) => {
  const {series} = require('async')

  let contract = require('../helpers/web3-contract'),
      db         = require('../models'),
      checksum   = require('checksum'),

      buys = {}

  const buys_from_contract = next => {
    contract.$utility.methods
      .dailyTotals()
      .call()
      .then( periods => {

        //Prune the result
        periods.length = config.period+1

        //Get a sha1 hash of the result.
        buys.contract = checksum(periods.toString())

        next()
      })
  }

  const buys_from_db = next => {
    db.sequelize
      .query(`SELECT sum(eth_amount) FROM buys WHERE period<=${config.period} GROUP BY period ORDER BY period ASC`, {type: db.sequelize.QueryTypes.SELECT})
      .then(periods => {

        //transform results
        periods = periods.map( period => period['sum(eth_amount)'] )

        //Prune the result
        periods.length = config.period+1

        //Get a sha1 hash of the result.
        buys.db = checksum(periods.toString())

        next()
      })
  }

  const test = finish => {
    buys.contract === buys.db ? finish() : finish(`${buys.contract} != ${buys.db}`)
  }

  series([
    buys_from_contract,
    buys_from_db,
    test
  ], (error) => {
    if(error)
      state.tests.daily_buys = error
    else
      state.tests.daily_buys = true

    callback(null, state)
  })
}
