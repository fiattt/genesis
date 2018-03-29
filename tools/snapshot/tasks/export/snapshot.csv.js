module.exports = ( state, callback ) => {

  const async        = require('async'),
        json_to_csv  = require('json-to-csv'),
        fs           = require('fs'),
        db           = require('../../models')

  const csv = callback => {
    db.Snapshot
      .findAll({ order: [ ['balance', 'DESC'] ] })
      .then( results => {
        let _results = results.map( result => {
          return {user: result.dataValues.user, key: result.dataValues.key, balance: result.dataValues.balance}
        })
        json_to_csv(_results, state.files.path_snapshot_csv, false)
          .then(() => {
            console.log(`${results.length} Records Saved to CSV`)
            if(config.overwrite_snapshot) fs.createReadStream(state.files.path_snapshot_csv).pipe(fs.createWriteStream(state.files.file_snapshot_csv))
            callback(null, state)
          })
          .catch( error => { throw new Error(error) })
      })
      .catch( error => { throw new Error(error) })
  }

  db.Snapshot
    .destroy({ truncate : true, cascade: false })
    .then( () => {
      db.sequelize
        .query('INSERT INTO `snapshot` (`user`, `key`, `balance`) SELECT `address`, `eos_key`, `balance_total` FROM `wallets` WHERE `valid`=1 ORDER BY `balance_total` DESC')
        .then(results => {
          console.log( 'Snapshot Table Synced' )
          csv( callback )
        })
        .catch( error => { throw new Error(error) })
    })



}
