module.exports = ( state, complete ) => {

  if(config.recalculate_wallets === true) {
    console.log('recalculate_wallets set to true, skipping contract sync')
    complete(null, state)
    return
  }

  const db             = require('../../models'),

        db_config    = {ignoreDuplicates: true}

  let   util           = require('../../utilities'),
        web3           = require('../../services/web3').web3,
        web3Query      = require('../../services/web3').query,
        bn             = require('bignumber.js'),
        Iterator       = require('../../classes/Iterator'),

        sync = {},
        log_intval,
        iterator,
        settings = {}


  const transfers = (settings, next) => {
    scanCollection.transfers( settings.begin, settings.end )
      .then( transfers => {
        if(transfers.length) {
          let request = []
          transfers.forEach( transfer => {
            request.push({
              tx_hash:      transfer.transactionHash,
              block_number: transfer.blockNumber,
              from:         transfer.returnValues.from,
              to:           transfer.returnValues.to,
              eos_amount:   new bn(transfer.returnValues.value).toFixed()
            })
          })
          // iterator.args.table.addRow('Transfers', request.length)
          state.sync_contracts.transfers+=request.length
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
              address:      buy.returnValues.user,
              period:       buy.returnValues.window,
              eth_amount:   new bn(buy.returnValues.amount).toFixed()
            })
          })
          // iterator.args.table.addRow('Buys', request.length)
          state.sync_contracts.buys+=request.length
          db.Buys.bulkCreate( request )
            .then( () => { next() })
            .catch(console.log)
        } else {
          next()
        }
      })
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
                address:      claim.returnValues.user,
                period:       claim.returnValues.window,
                eos_amount:   new bn(claim.returnValues.amount).toFixed()
              })
          })
          // iterator.args.table.addRow('Claims', request.length)
          state.sync_contracts.claims+=request.length
          db.Claims.bulkCreate( request )
            .then( () => { next() })
            .catch(console.log)
        } else {
          next()
        }
      })
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
              address:      registration.returnValues.user,
              eos_key:      registration.returnValues.key
            })
          })
          // iterator.args.table.addRow('Registrations', request.length)
          state.sync_contracts.registrations+=request.length
          db.Registrations.bulkCreate( request, db_config )
            .then( () => { next() })
            .catch(console.log)
        } else {
          next()
        }
      })
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
                address:      reclaimable.returnValues.from,
                eos_amount:   eos_amount.toFixed()
              })
            }
          });
          // iterator.args.table.addRow('Reclaimables', request.length)
          state.sync_contracts.reclaimables+=request.length
          db.Reclaimables.bulkCreate( request, db_config )
            .then( () => { next() })
            .catch(console.log)
        } else {
          next()
        }
      })
  }

  const log = (color, complete) => {
    const Table  = require('ascii-table'),
          colors = require('colors/safe')

    let   table

    if(complete)
      table = new Table(`100%: ${state.block_begin} ~> ${state.block_end}`)
    else
      table = new Table(`${Math.round(settings.index/settings.total*100)}%: ${state.block_begin}~>${settings.end}`)

    table.addRow('Transfers', state.sync_contracts.transfers)
    table.addRow('Buys', state.sync_contracts.buys)
    table.addRow('Claims', state.sync_contracts.claims)
    table.addRow('Registrations', state.sync_contracts.registrations)
    table.addRow('Reclaimables', state.sync_contracts.reclaimables)
    console.log(colors[color](table.setAlign(0, Table.RIGHT).setAlign(1, Table.LEFT).render()))
    // console.log(colors.gray.italic(`Started: ${settings.time_formatted().elapsed}, Average: ${iterator.time_formatted().average}`))
  }

  const log_periodically = () => {
    log_intval = setInterval( () => log('gray'), 10*1000 )
  }

  const sync_contracts = synced => {
    console.log(`Syncing Contract State between block #${state.block_begin} & ${state.block_end}`)

    const _for = require('async-for')

    const per_iteration = 100
    const iterations = Math.ceil((state.block_end - state.block_begin)/per_iteration)
    const offset = state.block_begin

    console.log(per_iteration,iterations,offset)

    var loop = _for(0, function (i) { return i <= iterations }, function (i) { return i + 1; },
      function loopBody(i, _break, _continue) {
        settings.begin = (i*per_iteration)+offset
        settings.end = settings.begin+per_iteration-1
        settings.index = i
        settings.total = iterations

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
      console.log('finished')
      setTimeout(synced, 5000)
    })

    console.log('Syncing Contracts, this will take a while.')
    log_periodically()
  }

  state.sync_contracts = {
    buys:0,
    claims:0,
    registrations:0,
    transfers:0,
    reclaimables:0
  }

  sync_contracts( () => {
    complete( null, state )
  })

}
