const async     = require('async')
const db        = require('../../models')
const redis     = require('../../services/redis')

let util        = require('../../utilities')
let web3        = require('../../services/web3').web3

let block_index = 0
    blocks_total = 0,
    addresses = [],
    pks_discovered = 0,
    blocks_processed = 0,
    status_log_intval = false,

    state = {},
    config = {}

const status_log = () => {
  blocks_total = state.block_end-block_index
  status_log_intval = setInterval( () => {
    redis.keys('*', (err, replies) => {
      let success_rate =  (pks_discovered/(replies.length+pks_discovered)*100) | 0
      console.log('Status', `${block_index} ~> ${state.block_end}: ${blocks_processed/blocks_total*100 | 0}% Complete [${blocks_processed}/${blocks_total} blocks]`)
      console.log('Successful Pk Discoveries:', pks_discovered)
      console.log('Unknown Pub Keys Remaining', replies.length)
      console.log('Cumulative Discovery Rate', `${success_rate}%`)
    })
  }, 10000)
}

const iterate_blocks = (callback) => {
  const iterate = () => iterate_block_txs( iterate, callback )
  iterate()
}

const iterate_block_txs = (next_block, finished) => {
  console.log(block_index)

  if(block_index > state.block_end) {
    finished()
    return
  }
  web3.eth
    .getBlock(block_index)
    .then( block => {
      async.each(
        block.transactions,
        (txhash, next_tx) => check_tx(txhash, next_tx),
        (err) => {
          if(err)
            throw new Error(err)
          else
            block_index++,
            blocks_processed++,
            next_block()
        }
      )
    })
}

//Check TX
const check_tx = (txhash, next_tx) => {
  web3.eth
    .getTransaction(txhash)
    .then( tx => {
      redis.get(tx.from, (err, reply) => {
        if(reply)
          update_address_key(tx.from, tx.hash, next_tx)
        else
          next_tx()
      });
    })
}

const update_address_key = (address, txhash, next_tx) => {
  util.misc.pubkey_from_tx_hash(txhash, pubkey => {
    const eos_key = util.misc.convert_ethpk_to_eospk(pubkey)
    if(util.misc.is_eos_public_key(eos_key)) {
      db.Wallets
        .update({
          eos_key: eos_key,
          fallback: true,
          fallback_error: null,
          valid: true
        },
        {
          where : {
            address: address
          }
        })
        .then( () => {
          if(config.persist)
            db.Keys
              .upsert({ address: address, tx_hash: txhash, public_key: pubkey, derived_eos_key: eos_key })
              .then( () => db.State.upsert( {meta_key: 'synced_block_pubkey', meta_value: block_index } ))

          console.log(`EOS Key Generated: #${block_index} => ${txhash} => ${address} => ${pubkey} => ${eos_key}`)
          redis.del(address);
          pks_discovered++
          next_tx()
        })
    }
    else {
      next_address()
    }
  })
}

const get_addresses = (callback) => {
  console.log('Querying Eligible addresses')
  db.Wallets
    .findAll({
      attributes: ['address'],
      where: {
        fallback_error: "ethpk_not_found"
      }
    })
    .then( results => {
      console.log('res', results.length)
      addresses = results.map( result => result.dataValues.address )
      console.log(`${addresses.length} Found`)
      callback()
    })
}

const populate_datastore = (callback) => {
  console.log('Redis: Flushing DB')
  redis.flushdb((err, success) => {
    if(success)
      console.log("Redis: Unique addresses Flushed from Data Store"), // will be true if successfull
      console.log(`Redis: Adding ${addresses.length} unique addresses to datastore`),
      addresses.forEach( address => {
        redis.set(address, 1)
      })
      setTimeout(() => {
        callback()
        addresses = null
      }, 1)
  })
}

module.exports = (_config, _state, complete ) => {
  config = _config
  state =  _state

  if(!config.fallback) {
    finished()
  }
  else {
    async.series([
      next => get_addresses(next),
      next => populate_datastore(next),
      next => iterate_blocks(next)
    ], () => complete(null, state) )
    status_log( state )
  }
}
