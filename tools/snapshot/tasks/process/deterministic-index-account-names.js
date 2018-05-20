module.exports = (state, complete) => {
  const db    = require('../../models'),
        async = require('async'),
        base32 = require('hi-base32')

  const get_addresses = (callback) => {
    db.Wallets.findAll({
      attributes: ["address"],
      order: [
            ['first_seen', 'ASC'],
            ['address', 'ASC'],
        ],
    }, {type: db.sequelize.QueryTypes.SELECT})
      .then( addresses => {
        console.log(`Deterministic Index: Found ${addresses.length} Addresses`)
        callback(null, addresses)
      })
      .catch( e => { throw new Error(e)} )
  }

  const set_deterministic_indices = (addresses, callback) => {
    console.log(`Deterministic Index: Setting Indices`)
    addresses = addresses.map( (address, index) => { return { address: address.dataValues.address, deterministic_index: index+1 } })
    callback(null, addresses)
  }

  const set_account_names = (addresses, callback) => {
    console.log(`Deterministic Index: Setting Account Names`)
    addresses = addresses.map( address => {
      let account_name = base32.encode( address.deterministic_index.toString() ).replace(/=/g, "").toLowerCase()
      if(account_name.length > 12) { throw new Error(`${account_name} is greater than 12 characters`) }
      // else if (account_name.length == 12) { console.log(`${wallet.address}:${wallet.deterministic_index} is exactly 12 characters`) }
      else if (address.address == CS_ADDRESS_B1 ) { account_name = "b1" }
      else { account_name = account_name.padEnd(12, "genesis11111") }
      address.account_name = account_name
      return address
    })
    callback(null, addresses)
  }

  const update_addresses = (error, addresses) => {
    if(error) {
      throw new Error(error)
      return
    }
    async.eachOfSeries(addresses, (address, key, next) => {
      db.Wallets
        .update({
            deterministic_index: address.deterministic_index,
            account_name: address.account_name,
          },
          { where : { address: address.address } })
        .then( (error, result) => {
          next()
        })
        .catch( e => {throw new Error(e)})
    }, () => complete(null, state) )
  }

  async.waterfall(
    [ get_addresses, set_deterministic_indices, set_account_names ],
    update_addresses
  )
}
