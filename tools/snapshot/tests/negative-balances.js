// count(negative-balances) > 0 (fail)
let db         = require('../models')

module.exports = ( callback ) => {
  db.sequelize
    .query(`SELECT address FROM wallets WHERE balance < 0`, {type: db.sequelize.QueryTypes.SELECT})
    .then(anomalies => {
      if(anomalies)
        callback('Fail')
      else {
        callback(null, 'Pass')
      }
    })
}
