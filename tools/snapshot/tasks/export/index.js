module.exports = ( state, complete ) => {
  //
  state.completed = (Date.now() / 1000 | 0)
  //

  const series    = require('async').series
  const Snapshot  = require('../../models').Snapshot
  const inspect = require('util').inspect

  const set_period_subdir = callback => {
    const fs = require('fs'), util = require('util')
    fs.readdir(state.files.period_dir, (err, files) => {
      console.log(inspect(files))
      files = files.filter( r => !r.includes('.') )
      callback(files.length)
    });
  }

  const get_ss_fs = () => {
    fs = {}
    fs.file_snapshot_csv = 'snapshot.csv'
    fs.file_snapshot_json = 'snapshot.json'
    fs.file_distribution_csv = 'distribution.csv'
    fs.file_db_sql = 'db.sql'
    fs.data_dir = './data'
    fs.period_dir = `${fs.data_dir}/${config.period}`
    return fs
  }

  const get_ss_fs2 = (version) => {
    state.files.period_version        = `${state.files.period_dir}/${version}`
    state.files.path_snapshot_csv     = `${state.files.period_version}/${state.files.file_snapshot_csv}`
    state.files.path_snapshot_json    = `${state.files.period_version}/${state.files.file_snapshot_json}`
    state.files.path_distribution_csv = `${state.files.period_version}/${state.files.file_distribution_csv}`
    state.files.path_db_sql           = `${state.files.period_version}/${state.files.file_db_sql}`
  }

  const mkdir = callback => {
    const fs = require('fs')
    if (!fs.existsSync(state.files.data_dir))
      fs.mkdirSync(state.files.data_dir)
    if (!fs.existsSync(state.files.period_dir))
      fs.mkdirSync(state.files.period_dir)
    callback()
  }

  const mkdir2 = callback  => {
    const fs = require('fs')
    if (!fs.existsSync(state.files.period_version))
      fs.mkdirSync(state.files.period_version),
      callback()
  }

  const snapshot_csv = callback => {
    const output = require('./snapshot.csv')
    output(state, callback)
  }

  const snapshot_json = callback => {
    const output = require('./snapshot.json')
    output(state, callback)
  }

  const distribution_csv = callback => {
    const output = require('./distribution.csv')
    output(state, callback)
  }

  const db_sql = callback => {
    const output = require('./db.sql')
    output(state, callback)
  }

  state.files = get_ss_fs()
  series([
    next => Snapshot.destroy({ truncate : true, cascade: false }).then(next),
    mkdir,
    next => {
      set_period_subdir( version => {
          get_ss_fs2( version )
          next()
      })
    },
    mkdir2,
    snapshot_csv,  //dumps snapshot table into csv
    snapshot_json, //outputs some metadata about the snapshot
    distribution_csv, //Output of entire distribution
    db_sql            // database ouput
  // ], () => complete( null, state ) )
])

}
