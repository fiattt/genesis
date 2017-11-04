const async     = require('async')

const Task      = require('../../classes/Task'),
      sequelize = require('../../models').sequelize
let   redis,
      web3

const check = connected => {
  async.series([
    check_redis,
    check_mysql,
    check_web3_connected,
    check_web3_synced
  ], () => connected() )
}

const check_redis = connected => {
  const check = () => {
    try {
      redis = require('../../services/redis')
      return true
    }
    catch(e) {
      return false
    }
  }

  if(check())
    console.log('Connected to Redis'),
    connected()
  else
    console.log(`Cannot connect to MySQL, trying again in 5 seconds`),
    setTimeout( check, 1000*5 )

}

const check_mysql = connected => {
  const check = () => {
    return sequelize.authenticate()
  }
  check().then( errors => {
    if(!errors)
      console.log('Connected to MySQL'),
      connected()
    else
      console.log(`Cannot connect to MySQL, trying again in 5 seconds`),
      setTimeout( check, 1000*5 )
  })
}

const check_web3_connected = connected => {
  // TODO atrocious pattern result of another atrocious pattern (result of attempt to separate web3 logic from Snapshot logic. Possibly misguided)

  const check = () => {
    return web3.eth.net.isListening()
  }

  const not_connected = retry => {
    console.log(`Web3 isn't connected, trying again in 5 seconds`),
    setTimeout( retry, 1000*5 )
  }

  web3 = require('../../services/web3').web3

  check().then( ready => {
    if(ready)
      console.log('Connected to Web3'),
      connected()
    else
      not_connected()
  })

}

const check_web3_synced = synced => {
  const check = () => {
    web3.eth.isSyncing().then( syncing => {
      if(!syncing)
        console.log(`Web3 is synced`),
        synced()
      else
        console.log(`Web3 is Still Syncing (At Block #${syncing.currentBlock}). trying again in 30 seconds`),
        setTimeout( check, 1000*30)
    })
  }
  check()
}

class TaskConnected extends Task {
  job(){
    async.series([
      check_redis,
      check_mysql,
      check_web3_connected,
      check_web3_synced
    ], () => this.finished() )
  }
}

module.exports = TaskConnected
