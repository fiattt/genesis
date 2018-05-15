module.exports = ( state, complete ) => {

  const query = require('../../queries'),
        base32 = require('hi-base32'),
        eachOf = require('async').eachOf,
        db = require('../../models')

  let cache = []

  console.log('account names')

  const set_account_name = (wallet, key, callback) => {
    let account_name = base32.encode( wallet.deterministic_index.toString() ).replace(/=/g, "").toLowerCase()
    if(account_name.length > 12) { throw new Error(`${account_name} is greater than 12 characters`) }
    // else if (account_name.length == 12) { console.log(`${wallet.address}:${wallet.deterministic_index} is exactly 12 characters`) }
    else { account_name = account_name.padEnd(12, "0") }
    db.sequelize.query( `UPDATE wallets SET account_name="${account_name}" WHERE address="${wallet.address}";`)
      .then( res => {  console.log(account_name, "for", wallet.address, "and index", wallet.deterministic_index), callback() })
      .catch( e => {throw new Error(e)} )
  }

  const loop_finished = err => {
    console.log('finished')
    complete(null, state)
  }

  query.address_deterministic_indices( results => {
    eachOf(results, set_account_name, loop_finished)
  })
}
