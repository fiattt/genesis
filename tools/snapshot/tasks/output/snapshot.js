const series    = require('async').series
const Task      = require('../../classes/Task')

const mkdir = (config, callback) => {
  const fs = require('fs')
  if (!fs.existsSync(config.dir))
    fs.mkdirSync(config.dir)
  callback()
}

const csv = (config, callback) => {
  const output = require('./snapshot.csv')
  output(config, callback)
}

const json = (config, callback) => {
  const output = require('./snapshot.json')
  output(config, callback)
}

const get_ss_fs = (config) => {
  ss_fs_config = {}
  ss_fs_config.file_csv = 'snapshot.csv'
  ss_fs_config.file_json = 'snapshot.json'
  ss_fs_config.dir = `./data/${config.period}`
  ss_fs_config.path_csv = `${ss_fs_config.dir}/${ss_fs_config.file_csv}`
  ss_fs_config.path_json = `${ss_fs_config.dir}/${ss_fs_config.file_json}`
  return ss_fs_config
}

class TaskSnapshot extends Task {
  job(){
    const Snapshot  = require('../../models').Snapshot
    this.state.files = get_ss_fs( this.config )
    series([
      next => Snapshot.destroy({ truncate : true, cascade: false }).then(next),
      next => mkdir(this.state.files, next),
      next => csv(this.state.files, next)  //dumps snapshot table into csv
      // next => json(this.state.files, next)  //outputs some metadata about the snapshot
    ], () => this.finished() )
  }
}

module.exports = TaskSnapshot
