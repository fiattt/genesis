require('./lib/globals')

const Table = require('ascii-table'),
      colors = require("colors/safe")

const run = (config) => {
  const Snapshot = require('./classes/Snapshot')
  let snapshot = new Snapshot( config, (error, result) => {
    if(error)
      console.log('Error:', error)
    else
      console.log('Result:', result)
  })
}

module.exports = () => {
  const prompt = require('./prompt')
  const async = require('async')
  const fs = require('fs')

  async.waterfall([
    next => {
      prompt.start(),
      prompt.get( prompt.schema, (error, config) => {
        next(null, config)
      })
    },
    (config, next) => {
      if(config.load_config) config = require('../../config')
      config = Object.assign( require('../../config.default'), config )
      global.REDIS_HOST             = config.redis_host
      global.REDIS_PORT             = config.redis_port
      global.SS_CONFIG_MYSQL_DB     = config.mysql_db
      global.SS_CONFIG_MYSQL_USER   = config.mysql_user
      global.SS_CONFIG_MYSQL_PASS   = config.mysql_pass
      global.SS_CONFIG_MYSQL_HOST   = config.mysql_host
      global.SS_CONFIG_MYSQL_PORT   = config.mysql_port
      global.SS_CONFIG_ETHAPI_TYPE  = config.eth_node_type
      global.SS_CONFIG_ETHAPI_PATH  = config.eth_node_path
      next(null, config)
    }],
    //complete
    (error, config) => {
      let table = new Table('Settings')
      Object.keys(config).forEach((key,index) => {
        table.addRow([key, config[key]])
      })
      console.log(colors.green(table.setAlign(1, Table.LEFT).setAlign(0, Table.RIGHT).render()))
      console.log(colors.white('Starting in 5 seconds.'))
      setTimeout( () => {
        run(config)
      }, 5000)
  } )
}
