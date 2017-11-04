const async = require('async')
const bn = require('bignumber.js')
const db = require('./models')
const Sequelize = require('Sequelize')
const Op = Sequelize.Op;

const utilities = {}

//This is necessary for testnet mode, contract.$token.balanceOf() will not be accurate for testnet snapshot.
//Note: Far slower than balanceOf
utilities.get_address_transfers = (address, callback) => {

  let transfers = []

  const add = next => {
    db.Transfers
      .findAll({
        attributes: ['eos_amount'],
        where: {
          to: address,
          block_number: {
            [Op.lte]: to_block
          }
        }
      })
      .then( results => {
        let _results = results.map( result => new bn(result.eos_amount) )
        transfers = transfers.concat(_results)
        next()
      })
  }

  const subtract = next => {
    db.Transfers
      .findAll({
        attributes: ['eos_amount'],
        where: {
          from: address,
          block_number: {
            [Op.lte]: to_block
          }
        }
      })
      .then( results => {
        let _results = results.map( result => new bn(result.eos_amount).times(-1) )
        transfers = transfers.concat(_results)
        next()
      })
  }

  async.series([
    add,
    subtract
  ], () => { callback(transfers) })
}

utilities.balance_wallet_calculate = ( address, to_block, callback ) => {

  let transfers = []

  const add = next => {
    db.Transfers
      .findAll({
        attributes: ['eos_amount'],
        where: {
          to: address,
          block_number: {
            [Op.lte]: to_block
          }
        }
      })
      .then( results => {
        let _results = results.map( result => new bn(result.eos_amount) )
        transfers = transfers.concat(_results)
        next()
      })
  }

  const subtract = next => {
    db.Transfers
      .findAll({
        attributes: ['eos_amount'],
        where: {
          from: address,
          block_number: {
            [Op.lte]: to_block
          }
        }
      })
      .then( results => {
        let _results = results.map( result => new bn(result.eos_amount).times(-1) )
        transfers = transfers.concat(_results)
        next()
      })
  }

  const calculate = () => {
    let result = transfers.reduce( (acc, current) => { return acc.plus(current) }, new bn(0) )
    callback( result.toFixed(4) )
  }

  async.series([
    add,
    subtract
  ], calculate)

}

//Necessary for testnet snapshots
utilities.get_user_last_register = (address, begin, end, callback) => {
  db.Registrations
    .findAll({
      attributes: ['eos_key'],
      where: {
        address: address,
        [Op.and] : [
          {
            block_number: {
              [Op.gte] : begin
            }
          },
          {
            block_number: {
              [Op.lte] : end
            }
          }
        ]
      },
      order: [['block_number', 'DESC']],
      limit: 1
    })
    .then( results => callback( results.length ? results[0].dataValues.eos_key : null ) )
}

module.exports = utilities
