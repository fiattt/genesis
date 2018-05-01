module.exports = ( state, complete ) => {

  const async     = require('async'),
        db        = require('../../models'),
        Table     = require('ascii-table'),
        util        = require('../../utilities')

  let   start_block = CS_BLOCK_FIRST,
        block_index = start_block, //first ethereum block with txs
        blocks_total = 0,
        pks_found = 0,
        blocks_processed = 0,
        status_log_intval = false,
        fallback = {},

        //benchmarking
        started = 0,
        ms_per_block = 0,
        blocks_checked = 0,
        total_time = 0,
        elapsed = 0

  const tx_hash_from_query_results = ( results, callback ) => (results.length) ? callback( results[0].dataValues.tx_hash ) : callback( false )
  const pubkey_from_tx_hash        = ( tx_hash, callback ) => util.misc.get_tx(tx_hash).then( result => { callback( result.publicKey ) })

  //TODO Fix callback hell
  const iterate_blocks = ( callback ) => {
    const _for = require('async-for')
    var loop = _for(start_block, (i) => i<=state.block_end, function(i){ return i+1 }, iterate);

    function iterate(i, _break, _continue) {
      block_index = i
      if(i > state.block_end) {
        _break()
        return
      }
      try {
        web3.eth
          .getBlock( i, true )
          .then( block => {
            async.each(
              block.transactions,
              (tx, next_tx) => check_tx(tx, next_tx),
              (err) => {
                if(err)
                  throw new Error(err)
                else
                  blocks_processed++,
                  _continue()
              }
            )
          })
      }
      catch(e) {
        throw new Error(e)
      }
    }

    loop(() => { complete(null, state) })
  }

  //Check TX
  const check_tx = (tx, next_tx) => {
    try {
      redis.get(tx.from, (err, reply) => {
        if(reply)
          update_address_key(tx.from, tx.hash, next_tx)
        else
          next_tx()
      });
    }
    catch(e) {
      throw new Error(e)
    }
  }

  const update_address_key = (address, tx_hash, next_tx) => {
    pubkey_from_tx_hash(tx_hash, pubkey => {
      const eos_key = util.misc.convert_ethpk_to_eospk(pubkey)
      if(util.misc.is_eos_public_key(eos_key))
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
            if(config.cache_signatures)
              db.Keys.upsert({ address: address, tx_hash: tx_hash, public_key: pubkey, derived_eos_key: eos_key })
            // console.log(`EOS Key Generated: #${block_index} => ${tx_hash} => ${address} => ${pubkey} => ${eos_key}`)
            redis.del(address);
            pks_found++
            next_tx()
          })
      else
        next_tx()
    })
  }

  const status_log = () => {
    blocks_total = state.block_end-block_index
    status_log_intval = setInterval( () => {
      redis.keys('*', (err, addresses) => {

        let table = new Table(`Slow Fallback`),
            success_rate = Math.floor(pks_found/(addresses.length+pks_found)*100)

        table.addRow('Progress', `${Math.floor(blocks_processed/blocks_total*100)}%` )
        table.addRow('PKs Found (slow)', pks_found)
        table.addRow('PKs Unfound (slow)', addresses.length)
        table.addRow('Found Rate (slow)', `${success_rate}%`)
        table.addRow('Current Block', block_index)
        table.addRow('Syncing to Block', state.block_end)
        table.addRow(`Total Checked`, blocks_processed)
        table.addRow(`Total Blocks`, blocks_total)
        console.log(table.setAlign(0, Table.RIGHT).setAlign(1, Table.LEFT).render())

      })
    }, 60*1000)
  }

  console.log('Fallback: Slow')
  status_log( state )
  iterate_blocks( () => { complete(null, state) } )

}
