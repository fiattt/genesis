const Queue = require('./Queue')

class Snapshot extends Queue {
  setup(){
    this.task( require('../tasks/misc/check-connections') )
        .task( require('../tasks/misc/truncate-db') )
        .task( require('../tasks/sync/periods') )
        .task( require('../tasks/sync/contract') )
        .task( require('../tasks/sync/wallets') )
        // .fn( require('../tasks/misc/pubkey-slow') )
        .task( require('../tasks/output/snapshot') )
        .task( require('../tasks/output/snapshot.json') )
        .begin()
  }
}

module.exports = Snapshot
