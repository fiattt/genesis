let table = require('ascii-table')

module.exports = ( complete ) {
  async.series([
    require('../../tests/total-daily-buys.js'),
    require('../../tests/negative-balances.js')
  ], (error) => {
    if(error)
      complete()
    else
      throw new Error(error)
      table.row()
      process.exit()
  })
}
