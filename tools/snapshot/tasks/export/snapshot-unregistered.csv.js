module.exports = ( state, callback ) => {

  const async        = require('async'),
        json_to_csv  = require('json-to-csv'),
        fs           = require('fs'),
        db           = require('../../models')

  const csv = callback => {
    db.SnapshotUnregistered
      .findAll({ order: [ ['balance', 'DESC'] ] })
      .then( results => {
        let _results = results.map( result => {
          return {user: result.dataValues.user, balance: result.dataValues.balance}
        })
        json_to_csv(_results, state.files.path_snapshot_unregistered_csv, false)
          .then(() => {
            console.log(`${results.length} Records Saved to CSV`)
            if(config.overwrite_snapshot) fs.createReadStream(state.files.path_snapshot_unregistered_csv).pipe( fs.createWriteStream(state.files.file_snapshot_unregistered_csv).catch() )
            callback(null, state)
          })
          .catch( error => { throw new Error(error) })
      })
      .catch( error => { throw new Error(error) })
  }

  db.SnapshotUnregistered
    .destroy({ truncate : true, cascade: false })
    .then( () => {
      db.sequelize
        .query(`INSERT INTO snapshot_unregistered (user, balance) SELECT address, balance_total FROM wallets WHERE valid=0 AND balance_total>${config.snapshot_minimum_balance} AND address!='${CS_ADDRESS_CROWDSALE}' AND address!='${CS_ADDRESS_TOKEN}' ORDER BY balance_total DESC`)
        .then(results => {
          console.log( 'Snapshot Table Synced' )
          csv( callback )
        })
        .catch( error => { throw new Error(error) })
    })




}
