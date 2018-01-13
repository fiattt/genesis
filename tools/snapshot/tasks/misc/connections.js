module.exports = (state, complete) => {

  const async     = require('async'),
        colors    = require('colors/safe')

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
        const redis = require('./services/redis')
        global.redis = redis(config.redis_host, config.redis_port)
        return true
      }
      catch(e) {
        return false
      }
    }

    if(check())
      console.log(colors.green.bold('Redis: Connected')),
      connected()
    else
      console.log(colors.red.bold(`Redis: Not Connected (trying again in 5 seconds)`)),
      setTimeout( check, 1000*5 )

  }

  const check_mysql = connected => {
    const mysql = require('./services/mysql')

    const check = () => {
      global.mysql = mysql(config.mysql_db, config.mysql_user, config.mysql_pass, config.mysql_host, config.mysql_port)
      return mysql.authenticate()
    }

    const not_connected = retry => {
      console.log(colors.red.bold(`MySQL: Not Connected (trying again in 5 seconds)`)),
      setTimeout( retry, 1000*5 )
    }

    check().then( errors => {
      if(!errors)
        console.log(colors.green.bold('MySQL: Connected')),
        connected()
      else
        not_connected( () => check_mysql(connected) )
    })
  }

  const check_web3_connected = connected => {
    const web3 = require('./services/web3')

    const check = () => {
      global.web3 = web3(config.eth_node_type, config.eth_node_path)
      return web3.eth.net.isListening()
    }

    const not_connected = retry => {
      console.log(colors.red.bold(`Web3: Not Connected (trying again in 5 seconds)`)),
      setTimeout( retry, 1000*5 )
    }

    check().then( ready => {
      if(ready)
        console.log(colors.green.bold('Web3: Connected')),
        connected()
      else
        not_connected( () => check_web3_connected(connected) )
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

  async.series([
    check_redis,
    check_mysql,
    check_web3_connected,
    check_web3_synced
  ], () => complete(null, state) )

}
