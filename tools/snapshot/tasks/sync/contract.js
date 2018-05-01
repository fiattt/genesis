module.exports = ( state, complete ) => {

  const db             = require('../../models'),
        db_config      = {ignoreDuplicates: true},
        colors         = require('colors/safe')

  let   util           = require('../../utilities'),
        scanCollection = require('../../helpers/web3-collection'),
        bn             = require('bignumber.js'),
        Iterator       = require('../../classes/Iterator'),

        sync = {},
        log_intval,
        iterator,
        settings = {}


  if(config.recalculate_wallets === true) {
    console.log('recalculate_wallets set to true, skipping contract sync')
    complete(null, state)
    return
  }

  state.sync_contract = {
    buys:0,
    claims:0,
    registrations:0,
    transfers:0,
    reclaimables:0
  }

  const transfers = (settings, next) => {

    scanCollection.transfers( settings.begin, settings.end )
      .then( transfers => {
        if(transfers.length) {
          let request = []
          transfers.forEach( transfer => {
            request.push({
              tx_hash:      transfer.transactionHash,
              block_number: transfer.blockNumber,
              from:         transfer.returnValues.from.toLowerCase(),
              to:           transfer.returnValues.to.toLowerCase(),
              eos_amount:   new bn(transfer.returnValues.value).toFixed()
            })
          })
          state.sync_contract.transfers+=request.length
          db.Transfers.bulkCreate( request )
            .then( () => { next() })
            .catch(console.log)
        } else {
          next()
        }
      })
  }

  const buys = (settings, next) => {
    scanCollection.buys( settings.begin, settings.end )
      .then( buys => {
        if(buys.length) {
          let request = []
          buys.forEach( buy => {
            request.push({
              tx_hash:      buy.transactionHash,
              block_number: buy.blockNumber,
              address:      buy.returnValues.user.toLowerCase(),
              period:       buy.returnValues.window,
              eth_amount:   new bn(buy.returnValues.amount).toFixed()
            })
          })
          state.sync_contract.buys+=request.length
          db.Buys.bulkCreate( request )
            .then( () => { next() })
            .catch(console.log)
        } else {
          next()
        }
      })
      .catch( e => { throw new Error(e)} )
  }

  const claims = (settings, next) => {
    scanCollection.claims( settings.begin, settings.end )
      .then( claims => {
        if(claims.length) {
          let request = []
          claims.forEach( claim => {
            request.push({
                tx_hash:      claim.transactionHash,
                block_number: claim.blockNumber,
                address:      claim.returnValues.user.toLowerCase(),
                period:       claim.returnValues.window,
                eos_amount:   new bn(claim.returnValues.amount).toFixed()
              })
          })
          state.sync_contract.claims+=request.length
          db.Claims.bulkCreate( request )
            .then( () => { next() })
            .catch(console.log)
        } else {
          next()
        }
      })
      .catch( e => { throw new Error(e)} )
  }

  const registrations = (settings, next) => {
    scanCollection.registrations( settings.begin, settings.end )
      .then( registrations => {
        if(registrations.length) {
          let request = []
          registrations.forEach( registration => {
            request.push({
              tx_hash:      registration.transactionHash,
              block_number: registration.blockNumber,
              address:      registration.returnValues.user.toLowerCase(),
              eos_key:      encodeURIComponent(eos_key_data_string)
            })
          })
          state.sync_contract.registrations+=request.length
          db.Registrations.bulkCreate( request )
            .then( () => { next() })
            .catch(console.log)
        } else {
          next()
        }
      })
      .catch( e => { throw new Error(e)} )
  }

  const reclaimables = (settings, next) => {
    scanCollection.reclaimables( settings.begin, settings.end )
      .then( reclaimables => {
        if(reclaimables.length) {
          let request = []
          reclaimables.forEach( reclaimable => {
            let eos_amount = new bn(reclaimable.returnValues.value)
            if(eos_amount.gt(0)) {
              request.push({
                tx_hash:      reclaimable.transactionHash,
                block_number: reclaimable.blockNumber,
                address:      reclaimable.returnValues.from.toLowerCase(),
                eos_amount:   eos_amount.toFixed()
              })
            }
          });
          state.sync_contract.reclaimables+=request.length
          db.Reclaimables.bulkCreate( request )
            .then( () => { next() })
            .catch(console.log)
        } else {
          next()
        }
      })
      .catch( e => { throw new Error(e)} )
  }

  const log = (color, complete) => {
    const Table  = require('ascii-table')

    let   table

    if(complete)
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

  const sync_contract = synced => {
    console.log(`Syncing Contract State between block #${state.block_begin} & ${state.block_end}`)

    const _for = require('async-for')

    settings.per_iteration = 100
    settings.iterations = Math.ceil((state.block_end - state.block_begin)/settings.per_iteration)
    settings.offset = state.block_begin

    let loop = _for(0, function (i) { return i <= settings.iterations }, function (i) { return i + 1; },
      function loopBody(i, _break, _continue) {
        settings.begin = (i*settings.per_iteration)+settings.offset
        settings.end = settings.begin+settings.per_iteration-1
        settings.index = i
        settings.total = settings.iterations

        if(settings.end > state.block_end) settings.end = state.block_end

        const parallel = require('async').parallel
        parallel([
            next => transfers( settings, next ),
            next => buys( settings, next ),
            next => claims( settings, next ),
            next => registrations( settings, next ),
            next => reclaimables( settings, next )
        ], result => {
          if(settings.end == state.block_end)
            _break()
          else
            _continue()
        })
      });

    loop(() => {
      clearInterval(log_intval)
      log('green', true)
      console.log(colors.green('Contract Syncing Complete'))
      setTimeout(synced, 5000)
    })

    console.log(`Syncing Contracts between block #${state.block_begin} and #${state.block_end}, this may take a while.`)
    log_periodically()
  }

  const resume = ( next ) => {
    if(config.resume) {
      const destroy_above_block = require('../../queries').destroy_above_block
      destroy_above_block(state.block_start, next)
    }
  }

  sync_contract( () => {
    complete( null, state )
  })

}
