const async        = require('async')
const Sequelize    = require('Sequelize')
const Op           = Sequelize.Op
const bn           = require('bignumber.js')

let query          = require('./queries'),
    address        = new Object()

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

address.last_register = query.last_register

// address.sum_wallet_balance = ( address, begion, end, sum ) => {
//   db.sequelize
//     .query('SELECT sum()', {type: db.sequelize.QueryTypes.SELECT})
// }

address.transfers = (address, begin, end, transfers_found) => {
  let transfers = []

  const add = next => {
    query.address_transfers_in(address, begin, end)
      .then( results => {
        let _results = results.map( result => new bn(result.dataValues.eos_amount) )
        transfers = transfers.concat(_results)
        next()
      })
  }

  const subtract = next => {
    query.address_transfers_out(address, begin, end)
      .then( results => {
        let _results = results.map( result => new bn(result.dataValues.eos_amount).times(-1) )
        transfers = transfers.concat(_results)
        next()
      })
  }

  async.series([
    add,
    subtract
  ], () => { transfers_found(transfers) })
}

address.buys = (address, begin, end, buys_found) => {
  query.address_buys(address, begin, end)
    .then( results => {
      let buys = new Array( CS_NUMBER_OF_PERIODS ).fill( new bn(0) )
      results.forEach( result => {
        buys[ result.dataValues.period ] = buys[ result.dataValues.period ].plus( new bn(result.dataValues.eth_amount) )
      })
      buys_found(buys)
    })
}

address.reclaimables = ( address, begin, end, reclaimables_found ) => {
  let reclaimables = []
  query.address_reclaimables( address, begin, end )
    .then( results => {
      if( results.length ) {
        reclaimables = results.map( result => { return { address: address, value: result.dataValues.eos_amount } } )
        console.log(reclaimables)
      }
      reclaimables_found( null, reclaimables )
    })
}

address.claims = (address, begin, end, claims_found) => {
  query.address_claims(address, begin, end)
    .then( results => {
      let claims = new Array( CS_NUMBER_OF_PERIODS ).fill( false )
      results.forEach( result => {
        claims[ result.dataValues.period ] = true
      })
      claims_found(claims)
    })
}

address.bulk_upsert = ( addresses ) => {
  return query.wallets_bulk_upsert( addresses )
}

module.exports = { address : address }
