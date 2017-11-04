// [sum(buys.eth_amount) == utility_contract.daily_buys]
// This verifies correct synchronization between contract and db, if this were wrong, it would not be noticed in supply levels, but would instead result in inaccurate user *unclaimed* balances in snapshot
let {contract} = require('../lib/eoscrowdsale-utils')
let db         = require('../models')
let checksum   = require('checksum')

let buys = {}

const buys_from_contract = callback => {
  contract.$utility.methods
    .dailyTotals()
    .call()
    .then( periods => {
      periods.length = SS_SNAPSHOT_TO_PERIOD+1
      buys.contract = checksum(periods.toString())
      callback()
    })
}

const buys_from_db = callback => {
  db.sequelize
    .query(`SELECT sum(eth_amount) FROM buys WHERE period<=${SS_SNAPSHOT_TO_PERIOD} GROUP BY period ORDER BY period ORDER ASC`, {type: db.sequelize.QueryTypes.SELECT})
    .then(periods => {
      periods = periods.map( period => period['sum(eth_amount)'] )
      periods.length = SS_SNAPSHOT_TO_PERIOD+1
      buys.db = checksum(periods.toString())
      callback()
    })
}

const test = () => {
  return buys.contract === buys.db
}

const run_test = callback => {
  series([
    buys_from_contract,
    buys_from_db
  ], (error) => {
    if(error)
      callback('Fail')
    else {
      callback(null, "Pass")
    }
  })
}
