require('./lib/globals')

module.exports = () => {
  const Table = require('ascii-table'),
        colors = require("colors/safe"),
        waterfall = require('async').waterfall,
        prompt = require('./prompt'),
        async = require('async'),
        fs = require('fs'),
        Snapshot = require('./snapshot')

  const boot = () => {
    async.waterfall([
      next => {
        prompt.start(),
        prompt.get( prompt.schema, (error, config) => {
          if(error)
            throw new Error(error)
          else
            next(null, config)
        })
      },
      (config, next) => {
        if(config.load_config) {
          try { config = require('../../config') }
          catch(e) {}
        }

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
        setTimeout( () => Snapshot(config), 5000)
    })
  }

  boot()
}
