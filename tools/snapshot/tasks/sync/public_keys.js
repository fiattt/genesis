module.exports = ( state, complete ) => {

  const cpus = require('os').cpus,
        threads = cpus().length,
        cp = require('child_process'),
        parallel = require('async').parallel,
        series = require('async').series,
        optimist = require('optimist'),
        db = require('../../models')

  let cache = [],
      control_flow = [],
      stats = [],
      resume_block = 0,
      lowest_block = 0,

      logIntval,
      progressIntval

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

  console.log(`${threads} cpus detected`)

  const setup = callback => {
    find_resume_block( () => {
      for(let i=0;i<threads;i++) {
        control_flow.push(callback => {
          thread_process(i, callback)
        })
      }
      logIntval = setInterval(log, 25000)
      callback()
    })
  }

  const run = () => {
    progress_interval()
    parallel(control_flow, (error, result) => {
      clearInterval(progressIntval)
      cache_lowest_block()
      save_resume_block( () => {
        console.log(error, result)
        console.log('All threads complete')
        clearInterval(logIntval)
        log()
        complete(null, state)
      })
    })
  }

  const thread_process = (i, callback) => {

    console.log('started thread process')

    let thread,
        settings = {
          id:i,
          threads:threads,
          state:state,
          config:config,
          resume_block:resume_block
        }

    if(optimist.argv.verbose_mt) {
      thread = cp.fork(`tools/snapshot/tasks/sync/public_keys_child_process.js`)
    } else {
      thread = cp.fork(`tools/snapshot/tasks/sync/public_keys_child_process.js`, [], { stdio: "ignore" })
    }

    const onMessage = (thread, message) => {
      stats[message.thread] = message
      cache_lowest_block()
    }

    const onClose = (thread, callback) => {
      console.log(`Thread ${thread}: Closed, reporting complete`)
      callback()
    }

    thread
      .on('message', (m) => onMessage(i, m) )
      .on('close', (m) => onClose(i, callback))
      .send(settings)

    console.log('finished thread process')

  }

  const progress_interval = () => {
    progressIntval = setInterval( () => save_resume_block(), 3000 )
  }

  const cache_lowest_block = () => {
    let blocks = stats.map( stat => stat.block ).filter(Number)
    // console.log(stats)
    if(blocks.length)
      lowest_block = Math.min.apply(null, blocks)
  }

  const save_resume_block = (callback=()=>{}) => {
    if(typeof resume_block === "number" && resume_block>0) {
      db.State
        .upsert({ meta_key: `sync_progress_keys`, meta_value: lowest_block })
        .then( (error, result) => callback )
    } else {
      callback()
    }
  }

  const find_resume_block = callback => {
    db.State
     .findAll({
        attributes: ['meta_value'],
        where: { meta_key: `sync_progress_keys` }
      })
      .then(resume_from => {
        if(resume_from && resume_from.length)
          resume_block = parseInt(resume_from[0].dataValues.meta_value),
          console.log(`Parent: Resuming from Block #${resume_block}`)
        else
          resume_block = state.block_begin,
          console.log(`Parent: No resume block found, starting at #${resume_block}`)

        callback()
      })
      .catch( e => { throw new Error(e) })
  }

  const log = () => {
    let count = 0;
    console.log(`-----------------`)
    stats.forEach( message => {
      console.log(`${message.thread}: ${message.progress} @ ${message.block}`)
      count++
    })
    console.log(`-----------------`)
    console.log(`  `)
  }

  setup( run )
}
