const fast = require('./fallback.fast')
const slow = require('./fallback.slow')

let config,
    state

const get_addresses = (callback) => {
  console.log('Querying Eligible addresses')
  db.Wallets
    .findAll({
      attributes: ['address'],
      where: {
        {
          [Op.and] : {
            balance_total : {
              [Op.gte] : 1
            },
            register_error : {
              [Op.eq] : null
            }
          }
        }
      }
    })
    .then( results => {
      let addresses = results.map( result => result.dataValues.address )
      console.log(`${addresses.length} Found`)
      callback( null, addressees )
    })
}

const populate_datastore = (addresses, callback) => {
  console.log('Redis: Flushing DB')
  redis.flushdb((err, success) => {
    if(success)
      console.log("Redis: Unique addresses Flushed from Data Store"), // will be true if successfull
      console.log(`Redis: Adding ${this.addresses.length} unique addresses to datastore`),
      addresses.forEach( address => {
        redis.set(address, 1)
      })
      setTimeout(() => {
        callback( null, addresses )
      }, 1)
  })
}

const fallback = (complete) => {
  async.series([
    get_addresses,
    populate_redis,
    fast,
    slow
  ],
  () => complete() )
}


class TaskFallback extends Task {

  setup(){
    this.state.sync_contracts = {
      buys:0,
      claims:0,
      registrations:0,
      transfers:0,
      reclaimables:0
    }
    state = this.state
    config = this.config
  }

  job(){
    this.setup()
    sync_contracts( () => {
      this.state = state
      this.finished()
    })
  }

}

module.exports = TaskFallback
