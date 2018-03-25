require('./lib/globals')

module.exports = () => {
  const Table = require('ascii-table'),
        colors = require("colors/safe"),
        waterfall = require('async').waterfall,
        prompt = require('./prompt'),
        fs = require('fs')

  const boot = () => {
    waterfall([
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

        next(null, config)
      }],
      //complete
      (error, config) => {
        let table = new Table('Settings')
        Object.keys(config).forEach((key,index) => {
          table.addRow([key, config[key]])
        })
        console.log(colors.green(table.setAlign(0, Table.RIGHT).setAlign(1, Table.LEFT).render()))
        console.log(colors.white('Starting in 5 seconds.'))

        //Save config globally
        global.config = config;

        setTimeout( () => {
          let   state = {}
          waterfall([
            next => next(null, state),
            require('./tasks/misc/connections'),
            require('./tasks/misc/truncate-db'),
            require('./tasks/sync/periods'),
<<<<<<< Updated upstream
            require('./tasks/sync/contract'),
            require('./tasks/sync/wallets'),
=======
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
>>>>>>> Stashed changes
            require('./tasks/misc/tests'),
            require('./tasks/sync/fallback'),
            require('./tasks/output/snapshot'),
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
