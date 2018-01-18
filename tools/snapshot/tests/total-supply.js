let db         = require('../models'),
    bn         = require('bignumber.js')

module.exports = ( state, callback ) => {
  let query = `SELECT sum(balance_total) FROM wallets`
  db.sequelize
    .query(query, {type: db.sequelize.QueryTypes.SELECT})
    .then( sum => {
      let total  = new bn(parseFloat(sum[0]['sum(balance_total)'])),
          expected = new bn(200000000+((CS_NUMBER_OF_PERIODS-1)*2000000))
      if(config.include_b1) expected += 100000000
      const diff = total.sub(expected)
      if(diff < 1.5 && diff > -1.5)
        state.tests.total_supply = true
      else
        state.tests.total_supply =  `${new bn(100).minus(new bn(total).div(new bn(expected)).times(100)).toFixed(16)}% Margin of Error is too high!`

      callback(null, state)
    })
    .catch( error => { throw new Error(error) })
}
