require('./lib/globals')

module.exports = () => {
  const Table = require('ascii-table'),
        colors = require("colors/safe"),
        waterfall = require('async').waterfall,
        async = require('async'),
        fs = require('fs')


  // require('shutdown-handler').on('exit', function(e) {
  //   e.preventDefault();
  //   console.log(colors.bold.red("Caught interrupt signal"));
  //   prompt_exit = require('./prompt-exit')
  //   prompt_exit.start()
  //   prompt_exit.get( prompt_exit.schema, (error, _exit) => {
  //     console.log(_exit)
  //     if(_exit == "y") {
  //       process.exit()
  //     }
  //   })
  //   var waitTill = new Date(new Date().getTime() + 1 * 1000);
  //   while(waitTill > new Date()){}
  // });

  const boot = () => {
    async.waterfall([
      next => {
        prompt = require('./prompt')
        prompt.start()
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
          catch(e) {
            console.log("It appears you've set load_config somehow without having a config file you rascal. Set to false.")
            throw new Error(e)
          }
        }

        if(typeof config.period === "undefined") {
          let period  = require('./utilities/periods')
          config.period = period.last_closed()
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
        console.log(colors.bold.white(table.setAlign(0, Table.RIGHT).setAlign(1, Table.LEFT).render()))
        console.log(colors.white('Starting in 5 seconds.'))

        //Save config globally
        global.config = config;

        setTimeout( () => {
          let   state = {}
                state.started = (Date.now() / 1000 | 0)

          waterfall([
            next => next(null, state),
            //Connect and check connections before starting
            require('./tasks/misc/connections'),
            //Dynamically set globals
            require('./tasks/misc/preload'),
            //Set the period map
            require('./tasks/sync/periods'),
            //Check if the crowdsale is ongoing and the token is stopped, "frozen"
            require('./tasks/sync/distribution-status'),
            //truncate all databases (except state) if config permits
            require('./tasks/misc/truncate-db'),
            //Set the block range of the snapshot.
            require('./tasks/sync/block-range'),
            //Sync events from the crowdsale contract
            require('./tasks/sync/contract'),
            //Calculate and validate each wallet.
            require('./tasks/sync/wallets'),
            //Run tests against data to spot any issues with integrity
            require('./tasks/misc/tests'),
            //Maybe run native registration fallback (v0.1) NOT RECOMMENDED.
            require('./tasks/sync/fallback'),
            //Generate output files.
            require('./tasks/output/snapshot')
          ], (error, result) => {
            console.log(`Snapshot for Period #${config.period} Completed.`)
            if(error)
              console.log('Error:', error)
          })

        }, 5000)
    })
  }

  boot()
}
