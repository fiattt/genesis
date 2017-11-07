module.exports = (config) => {
  const waterfall = require('async').waterfall

  let state = { config: config }
  waterfall([
    next => next(null, state),
    require('./tasks/misc/check-connections'),
    require('./tasks/misc/truncate-db'),
    require('./tasks/sync/periods'),
    require('./tasks/sync/contract'),
    require('./tasks/sync/wallets'),
    require('./tasks/misc/tests'),
    require('./tasks/sync/fallback'),
    require('./tasks/output/snapshot'),
  ], (error, result) => {
    console.log(`Snapshot for Period #${state.config.period} Completed.`)
    if(error)
      console.log('Error:', error)
    else
      console.log('Result:', result)
  })
}
