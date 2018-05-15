// global.Promise=require("bluebird")
require('./lib/globals')

module.exports = (COMPLETE) => {
  const Table = require('ascii-table'),
        colors = require("colors/safe"),
        waterfall = require('async').waterfall,
        async = require('async'),
        fs = require('fs'),
        period  = require('./utilities/periods')

  /***** ONLY FOR TEST ****/
  let _period = 0
  let SETUP = false

  const show_prompt = next => {
    prompt = require('./prompt')
    prompt.start()
    prompt.get( prompt.schema, (error, config) => {
      if(error)
        throw new Error(error)
      else
        next(null, config)
    })
  }

  const load_validate_config = (config, next) => {
    if(config.load_config) {
      try { config = require('../../config') }
      catch(e) {
        console.log("It appears you've set load_config somehow without having a config file you rascal. Duplicate the default config file and edit or set to false.")
        throw new Error(e)
      }
    }
    if(typeof config.period === "undefined") {
      let cache_period = config.period
      config.period = period.last_closed()
      console.log(colors.italic.red(`It appears didn't set a period at all. Period has been set to ${$config.period}`))
    }
    else if(config.period > period.last_closed()) {
      let cache_period = config.period
      config.period = period.last_closed()
      console.log(colors.italic.red(`It appears you've set your period to ${cache_period}, has not completed yet. Period has been reset to ${config.period}`))
    }
    else if(config.period > CS_MAX_PERIOD_INDEX) {
      let cache_period = config.period
      config.period = CS_MAX_PERIOD_INDEX
      console.log(colors.italic.red(`It appears you've set your period to ${cache_period}, which doesn't exist. Period has been reset to ${config.period}`))
    }
    config = Object.assign( require('../../config.default'), config )
    next(null, config)
  }

  const override_config_with_params = ( config, next ) => {
    const optimist = require('optimist')
          // inspect = require('util').inspect
    config = Object.assign( config, optimist.argv )
    //Remove optimist artifacts
    delete config.$0
    delete config._
    // console.log(inspect(config))

    next(null, config)
  }

  const run_snapshot = () => {
    let   state = {}
          state.timestamp_started = (Date.now() / 1000 | 0)

    waterfall([
      //Start waterfall with default state
      next => next(null, state),
      //Connect to mysql and web3 before starting
      (state, next) => {
        if(!SETUP) {
          const connections = require('./tasks/misc/connections')
          connections(state, () => {
            SETUP = true
            next(null, state)
          })
        } else {
          next(null, state)
        }
      },
      //Dynamically set globals
      require('./tasks/misc/preload'),
      //Set the period map
      require('./tasks/sync/periods'),
      //Check if the crowdsale is ongoing and the token is stopped, "frozen"
      require('./tasks/sync/distribution-status'),
      //Set the block range of the snapshot.
      require('./tasks/sync/block-range'),
      //truncate all databases (except state) if config permits
      require('./tasks/misc/truncate-db'),
      //Sync millions of ethereum public keys >_< (slow af but faster than the other one)
      require('./tasks/sync/public_keys'),
      //Sync events from the crowdsale contract
      require('./tasks/sync/contract'),
      //Calculate and validate each wallet.
      require('./tasks/sync/wallets'),
      //Fallback Registration
      require('./tasks/sync/fallback-registration.js'),
      //Deterministic Index and account names
      require('./tasks/misc/deterministic-index'),
      //Set account names based on deterministic index
      require('./tasks/misc/account-names'),
      //Run tests against data to spot any issues with integrity
      require('./tasks/misc/tests'),
      //Generate output files.
      require('./tasks/export')
    ], (error, state) => {
      console.log(`Snapshot for Period #${config.period} Completed.`)
      // const sync_progress_destroy = require('./queries').sync_progress_destroy
      if(typeof COMPLETE === 'function') {
        COMPLETE()
      } else {
        global.config.period++
        check_for_poll()
        console.log(`Running period ${config.period} in 10 seconds`)
        // setTimeout( () => {
        //   check_for_poll(state)
        // }, 10000)
      }
      if(error)
        console.log('Error:', error)
    })
  }

  const check_for_poll = (state) => {
    console.log("Should poll?", config.period, period.last_closed())
    if(config.period <= period.last_closed())
      run_snapshot(state)
    else
      console.log("New period not yet discovered, trying again in 60 seconds"),
      setTimeout( () => check_for_poll(state), 60000 )
  }

  const configuration_complete = (error, config, callback) => {

    /***** ONLY FOR TEST ****/
    config.period = _period

    let table = new Table('Settings')
    Object.keys(config).forEach((key,index) => {
      table.addRow([key, config[key]])
    })
    console.log(colors.bold.white(table.setAlign(0, Table.RIGHT).setAlign(1, Table.LEFT).render()))
    console.log(colors.white('Starting in 5 seconds.'))
    //Save config globally
    global.config = config;

    setTimeout( callback, 5000)
  }

  const configure = (callback) => {
    waterfall(
      [ show_prompt, load_validate_config, override_config_with_params ],
      (error, config) => configuration_complete(error, config, callback)
    )
  }

  configure( run_snapshot )
}
