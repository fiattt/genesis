const Sequelize = require('sequelize')
const connection = require('./services/mysql')

let db = {}

let stateConfig = {timestamps: false, ignoreDuplicates: true}

// model definition
db.Wallets = connection.define("wallet", {
  address: {
    type:             Sequelize.STRING(256),
    primaryKey:       true
  },
  eos_key:            Sequelize.STRING(256),
  balance_wallet:     Sequelize.DECIMAL(15,4),
  balance_unclaimed:  Sequelize.DECIMAL(15,4),
  balance_reclaimed:  Sequelize.DECIMAL(15,4),
  balance_total:      Sequelize.DECIMAL(15,4),
  registered:         Sequelize.BOOLEAN,
  fallback:           Sequelize.BOOLEAN,
  register_error:     Sequelize.STRING(256),
  fallback_error:     Sequelize.STRING(256),
  valid:              Sequelize.BOOLEAN,
}, {updateOnDuplicate: true, timestamps: false})

db.Transfers = connection.define('transfer', {
  id: {
    type:             Sequelize.INTEGER,
    primaryKey:       true
  },
  tx_hash:            Sequelize.STRING(256),
  block_number:       Sequelize.STRING(256),
  from:               Sequelize.STRING(256),
  to:                 Sequelize.STRING(256),
  eos_amount:         Sequelize.DECIMAL(65,0)
}, stateConfig)

db.Buys = connection.define('buy', {
  id: {
    type:             Sequelize.INTEGER,
    primaryKey:       true
  },
  tx_hash:            Sequelize.STRING(256),
  block_number:       Sequelize.STRING(256),
  address:            Sequelize.STRING(256),
  period:             Sequelize.INTEGER,
  eth_amount:         Sequelize.DECIMAL(65,0)
}, stateConfig)

db.Claims = connection.define('claim', {
  id: {
    type:             Sequelize.INTEGER,
    primaryKey:       true
  },
  tx_hash:            Sequelize.STRING,
  block_number:       Sequelize.STRING(256),
  address:            Sequelize.STRING(256),
  period:             Sequelize.INTEGER,
  eos_amount:         Sequelize.DECIMAL(65,0)
}, stateConfig)

db.Reclaimables = connection.define('reclaimable', {
  id: {
    type:             Sequelize.INTEGER,
    primaryKey:       true
  },
  tx_hash:            Sequelize.STRING(256),
  block_number:       Sequelize.STRING(256),
  address:            Sequelize.STRING(256),
  eos_amount:         Sequelize.DECIMAL(65,0)
}, stateConfig)

db.Registrations = connection.define('registration', {
  id: {
    type:             Sequelize.INTEGER,
    primaryKey:       true
  },
  tx_hash:            Sequelize.STRING(256),
  block_number:       Sequelize.STRING(256),
  address:            Sequelize.STRING(256),
  eos_key:            Sequelize.STRING(256)
}, stateConfig)

db.State = connection.define('state', {
  id: {
    type:             Sequelize.INTEGER,
    primaryKey:       true
  },
  meta_key:           Sequelize.STRING(256),
  meta_value:         Sequelize.STRING(4294967295) //longtext
}, {
  updateOnDuplicate:  true,
  timestamps:         false,
  freezeTableName:    true,
  tableName:          'state'
})

db.Snapshot = connection.define('snapshot', {
  user:               Sequelize.STRING(256),
  key:                Sequelize.STRING(256),
  balance:            Sequelize.DECIMAL(15,4)
}, {timestamps: false, freezeTableName: true, tableName: 'snapshot'})

db.Keys = connection.define('snapshot', {
  address:            Sequelize.STRING(256),
  tx_hash:            Sequelize.STRING(256),
  public_key:         Sequelize.STRING(256),
  derived_eos_key:    Sequelize.STRING(256)
}, {timestamps: false, freezeTableName: true, tableName: 'keys'})

db.sequelize = connection

module.exports = db
