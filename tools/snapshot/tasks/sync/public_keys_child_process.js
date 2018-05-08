require('../../lib/globals')

const CACHE_THRESHOLD = 10

let   id,
      state,
      thread_block_begin,
      thread_block_end,
      current_block

const setup = settings => {
  const connections = require('../misc/connections')

  id = settings.id
  threads = settings.threads
  state = settings.state

  block_begin = settings.resume_block
  block_end   = state.block_end

  global.config = settings.config

  let blocks_to_sync = block_end-block_begin,
      blocks_per_thread = Math.floor(blocks_to_sync/threads),
      blocks_extra = blocks_to_sync - (blocks_per_thread*threads)

  thread_block_begin = block_begin+id
  thread_block_end = thread_block_begin + blocks_to_sync - blocks_extra
  thread_block_end = (thread_block_end > block_end) ? thread_block_end - threads : thread_block_end

  connections(state, ( error, response ) => {
    setTimeout(run, id*50)
  })
}

const run = () => {
  const db             = require('../../models'),
        query          = require('../../queries'),
        db_config      = {ignoreDuplicates: true},
        colors         = require('colors/safe'),
        _for           = require('async-for'),
        each           = require('async').each,

        util           = require('../../utilities'),
        scanCollection = require('../../helpers/web3-collection'),
        bn             = require('bignumber.js')

  let   sync = {},
        log_intval,
        iterator,
        cache = [],
        cache_length = 0,
        block_current = 0,
        log = ""

  const pubkey_from_tx_hash = ( tx_hash, callback ) => {
    util.misc.get_tx(tx_hash).then( result => { callback( result.publicKey ) } )
  }

  const process_transactions = (block, next) => {
    each(
      block.transactions,
      find_sync_pub_key,
      (err) => {
        if(err)
          throw new Error(err)
        else
          current_block+=threads,
          next()
      }
    )
  }

  const build_public_key_query = (record) => {
    //Multiple threads can create indeterminism in this table, particularly if public key is added during period cross-over.
    //Conditional on duplicate key update will maintain determinism in this table, always save the lowest block number.
    // const query = `INSERT INTO public_keys (address, public_key, block_number) VALUES ('${record.address}', '${record.public_key}', ${record.block_number}) ON DUPLICATE KEY UPDATE block_number = IF(block_number > ${record.block_number}, ${record.block_number}, block_number); `
    const query = `INSERT INTO public_keys (address, public_key, block_number) VALUES ("${record.address}", "${record.public_key}", ${record.block_number}) ON DUPLICATE KEY UPDATE block_number = CASE WHEN VALUES(block_number) < block_number THEN VALUES(block_number) ELSE block_number END;`
    return query
  }

  const find_sync_pub_key = (tx, finished) => {
    pubkey_from_tx_hash(tx.hash, pubkey => {
      cache.push({ address: tx.from, public_key: pubkey, block_number: tx.blockNumber })
      // cache_length++
      finished()
    })
  }

  const sync_public_keys = result => {

    current_block = thread_block_begin

    console.log(`Thread ${id}: Syncing public keys between ${thread_block_begin} and ${thread_block_end} with a ${id} offset with ${threads} steps between each block`)

    const loop = _for(thread_block_begin, function (i) { return current_block<=thread_block_end }, function (i) { return i + 1; },
      function loopBody(i, _break, _continue) {
        web3.eth
          .getBlock( current_block, true )
          .then( block => {
            if(current_block == thread_block_end)
              console.log(`Thread ${id}: Last Pass Detected - Current:${current_block}, End: ${thread_block_end}`)
            if(cache.length>CACHE_THRESHOLD || current_block == thread_block_end)
              save_rows( () => { process_transactions(block, _continue ) } )
            else
              process_transactions(block, _continue )
          })
        }
    )

    loop(() => {
      console.log(colors.green(`Thread ${id}: Pubkey Syncing Complete`))
      setTimeout(() => { process.exit() }, 5000)
    })

  }

  const update_state = () => {
    let percent_complete = ((100-0)/(thread_block_end-thread_block_begin)*(parseInt(current_block)-thread_block_end)+100).toFixed(1)
    process.send({thread: id, block: parseInt(current_block), progress: `${percent_complete}%` })
   }

  const save_rows = ( callback, deadlock ) => {
    // console.log(config)
    // console.log(cache)
    // query.public_keys_bulk_upsert( cache )
    //   .then( result => {
    //     console.log(result)
    //     if(deadlock) console.log(`${id} DEADLOCK: RESOLVED`)
    //     cache = ""
    //     cache_length = 0
    //     update_state()
    //     callback()
    //   })
    //   .catch( e => {
    //     //We assume this is a deadlock, if you get repeated unresolved deadlocks, uncomment line below.
    //     throw new Error(e)
    //     console.log(`Thread ${id}: DEADLOCK: RETRY`)
    //     setTimeout( () => save_rows(callback, true), 500 )
    //   })
    db.Keys.bulkCreate( cache, {ignoreDuplicates: true} )
      .then( () => {
        if(deadlock) console.log(`${id} DEADLOCK: RESOLVED`)
        cache = []
        update_state()
        callback()
      })
      .catch( e => {
        //We assume this is a deadlock, if you get repeated unresolved deadlocks, uncomment line below.
        console.log(e)
        console.log(`Thread ${id}: DEADLOCK: RETRY`)
        setTimeout( () => save_rows(callback, true), 10 )
      })
  }

  sync_public_keys()
}

process.on('message', setup)
