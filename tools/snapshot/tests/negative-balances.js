// count(negative-balances) > 0 (fail)
let db         = require('../models')

module.exports = ( state, callback ) => {
  db.sequelize
    .query(`SELECT address FROM wallets WHERE balance_wallet<0 OR balance_unclaimed<0 OR balance_reclaimed<0`, {type: db.sequelize.QueryTypes.SELECT})
    .then(anomalies => {
      if(anomalies)
        callback('Found ${anomalies.length} Wallets with Negative Balances!!!')
      else {
        callback(null, 'Pass')
      }
    })
}
