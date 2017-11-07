module.exports = ( state, complete ) => {
  const Table = require( 'ascii-table' ),
        colors = require( 'colors/safe' ),
        async = require( 'async' )

  async.waterfall([
    next => next(null, state),
    require('../../tests/total-daily-buys.js'),
    require('../../tests/negative-balances.js')
  ], (error, results) => {
    if(!error)
      throw new Error(error),
      process.exit()
    else {
      let table = new Table('Tests')
      table.addRow('Daily Buys', '✓')
      table.addRow('Negative Balances', '✓')
      console.log(colors.green(table.render()))
      setTimeout( () => complete( null, state ), 5000 )
    }
  })
}
