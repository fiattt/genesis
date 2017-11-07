const async        = require('async'),
      Sequelize    = require('Sequelize'),
      Op           = Sequelize.Op,
      bn           = require('bignumber.js')

let   query        = require('./queries'),
      address      = {}

address.uniques = (begin, end, uniques_found) => {

  let uniques = new Set()

  const get_buy_uniques = ( next ) => {
    query.buys_in_range( begin, end )
      .then( results => {
        if(results)
          Array.from(results).forEach( result => {
            uniques.add(result.dataValues.address)
          })
          console.log(`Added ${results.length} buys to uniques, full size now ${uniques.size}`)
          next()
      })
  }

  const get_transfer_uniques = ( next ) => {
    query.transfers_in_range( begin, end )
      .then( results => {
        if(results)
          Array.from(results).forEach( result => {
            uniques.add(result.dataValues.to)
            uniques.add(result.dataValues.from)
          })
          console.log(`Added ${results.length} transfers to uniques, full size now ${uniques.size}`)
          next()
      })
  }

  async.series(
    [
      get_transfer_uniques,
      get_buy_uniques
    ],
    () => { uniques_found( uniques ) }
  )
}

module.exports = { address : address }
