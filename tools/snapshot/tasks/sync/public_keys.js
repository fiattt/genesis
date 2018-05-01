module.exports = ( state, complete ) => {

  const db             = require('../../models'),
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
        settings = {},
        cache = [],
        block_current = 0


  if(config.recalculate_wallets === true) {
    console.log('recalculate_wallets set to true, skipping ethereum public key sync')
    complete(null, state)
    return
  }

  if(config.registration_fallback === false) {
    console.log('registration_fallback set to false, skipping ethereum public key sync')
    complete(null, state)
    return
  }

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
          next()
      }
    )
  }

  const find_sync_pub_key = (tx, finished) => {
    pubkey_from_tx_hash(tx.hash, pubkey => {
      cache.push({ address: tx.from, public_key: pubkey })
      finished()
    })
  }

  const log = (color, finished) => {
    const Table  = require('ascii-table')

    let   table

    if(finished)
      table = new Table(`100%: ${state.block_begin} ~> ${state.block_end}`)
    else
      table = new Table(`${Math.floor(settings.index/settings.total*100)}%: ${state.block_begin}~>${settings.end}`)

    table.addRow('Transfers', state.sync_contract.transfers)
    table.addRow('Buys', state.sync_contract.buys)
    table.addRow('Claims', state.sync_contract.claims)
    table.addRow('Registrations', state.sync_contract.registrations)
    table.addRow('Reclaimables', state.sync_contract.reclaimables)
    console.log(colors[color](table.setAlign(0, Table.RIGHT).setAlign(1, Table.LEFT).render()))
  }

  const log_periodically = () => {
    log_intval = setInterval( () => log('gray'), 10*1000 )
  }

  const resume = ( next ) => {
    if(!config.resume) {
      const destroy_above_block = require('../../queries').destroy_above_block
      destroy_above_block(state.block_start, next)
    }
  }
  // log_periodically()

  const sync_public_keys = result => {
   settings.begin = state.block_begin
   settings.end   = state.block_end
   if(result && result.length) {
     settings.begin = parseInt(result[0].dataValues.meta_value)
     console.log(`Resuming from Block #${settings.begin}`)
   }

   const loop = _for(settings.begin, function (i) { return i <= settings.end }, function (i) { return i + 1; },
     function loopBody(i, _break, _continue) {
       block_current = i
       web3.eth
         .getBlock( i, true )
         .then( block => {
           if(cache.length>10000)
             db.Keys.bulkCreate( cache, {ignoreDuplicates: true} )
               .then( () => {
                 db.State
                   .upsert({ meta_key: "sync_progress_keys", meta_value: parseInt(block.number)-1 })
                   .then( () => {
                     console.log(`Imported ${cache.length} public keys to db`)
                     cache = []
                     process_transactions(block, _continue)
                   })
               })
               .catch( e => { throw new Error(e) } )
           else
             process_transactions(block, _continue)
         })
     }
   )

   loop(() => {
     // clearInterval(log_intval)
     // log('green', true)
     console.log(colors.green('Pubkey Syncing Complete'))
     setTimeout(() => complete(null, state), 5000)
   })

 }

 db.State
  .findAll({
     attributes: ['meta_value'],
     where: {
       meta_key: "sync_progress_keys"
     }
   })
   .then(sync_public_keys)

}
