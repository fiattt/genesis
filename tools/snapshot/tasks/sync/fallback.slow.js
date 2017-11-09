module.exports = ( state, complete ) => {

  const async     = require('async')
  const db        = require('../../models')
  const redis     = require('../../services/redis')

  let   util        = require('../../utilities')
  let   web3        = require('../../services/web3').web3

  let   block_index = 0,
        blocks_total = 0,
        pks_discovered = 0,
        blocks_processed = 0,
        status_log_intval = false

  const tx_hash_from_query_results = ( results, callback ) => (results.length) ? callback( results[0].dataValues.tx_hash ) : callback( false )
  const pubkey_from_tx_hash        = ( tx_hash, callback ) => util.misc.get_tx(tx_hash).then( result => { callback( result.publicKey ) })

  //TODO Fix callback hell
  const iterate_blocks = ( callback ) => {
    const iterate = () => iterate_block_txs( iterate, callback )
    iterate()
  }

  const iterate_block_txs = (next_block, finished) => {
    if(block_index > state.block_end) {
      finished()
      return
    }
    try {
      web3.eth
        .getBlock( block_index )
        .then( block => {
          async.each(
            block.transactions,
            (tx_hash, next_tx) => check_tx(tx_hash, next_tx),
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
    catch(e) {
      throw new Error(e)
    }
  }

  //Check TX
  const check_tx = (tx_hash, next_tx) => {
    try {
      web3.eth
        .getTransaction(tx_hash)
        .then( tx => {
          redis.get(tx.from, (err, reply) => {
            if(reply)
              update_address_key(tx.from, tx.hash, next_tx)
            else
              next_tx()
          });
        })
    }
    catch(e) {
      throw new Error(e)
    }
  }

  const update_address_key = (address, tx_hash, next_tx) => {
    pubkey_from_tx_hash(tx_hash, pubkey => {
      const eos_key = convert_ethpk_to_eospk(pubkey)
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
            if(state.config.persist)
              db.Keys.upsert({ address: address, tx_hash: tx_hash, public_key: pubkey, derived_eos_key: eos_key })
            console.log(`EOS Key Generated: #${block_index} => ${tx_hash} => ${address} => ${pubkey} => ${eos_key}`)
            redis.del(address);
            pks_discovered++
            next_tx()
          })
      }
      else {
        next_tx()
      }
    })
  }

  const status_log = () => {
    blocks_total = state.block_end-block_index
    status_log_intval = setInterval( () => {
      redis.keys('*', (err, addresses) => {
        let success_rate =  (pks_discovered/(addresses.length+pks_discovered)*100) | 0
        console.log('Status', `${block_index} ~> ${state.block_end}: ${blocks_processed/blocks_total*100 | 0}% Complete [${blocks_processed}/${blocks_total} blocks]`)
        console.log('Successful Pk Discoveries:', pks_discovered)
        console.log('Unknown Pub Keys Remaining', addresses.length)
        console.log('Cumulative Discovery Rate', `${success_rate}%`)
      })
    }, 10000)
  }

  if(!state.config.fallback) {
    complete(null, state)
  }
  else {
    status_log( state )
    iterate_blocks( () => { complete(null, state) } )
  }

}
