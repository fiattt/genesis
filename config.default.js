module.exports = {
  //Take snapshot up to which period? If left undefined, it will default to the last closed period.
  period: 0,

  //Run in which mode.
  // test - will generate a snapshot up to period defined.
  // mainnet - will ignore period parameter, check if the dist. is over and if the tokens are frozen, and only then generate a snapshot.
  mode: 'test',

  //The Author
  author: "Anonymous",

  //Enable fallback 1.0? (not recommended)
  registration_fallback: false,

  //Include block.one distribution in snapshot
  include_b1: true,

  //Minimum balance required for snapshot inclusion.
  //Note: 1 EOS is recommended, as there will be a minimum balance required to have the bandwidth required for a functional account. Additionally, this prevents dust from appearing as an initial accounts, and cleans up the chain.
  snapshot_minimum_balance: 1,

  //ETH node Connection Details
  eth_node_type: '',
  eth_node_path: '',

  //Redis Connection Details
  redis_host: null,
  redis_port: null,

  //Mysql Connection Details
  mysql_db: "eos_snapshot",
  mysql_user: "root",
  mysql_pass: null,
  mysql_host: "localhost",
  mysql_port: 3306,

  //
  // Advanced/Developer settings
  // Probably do not need to change this.
  //

  //Cache Signatures from/for fallback (speeds up multiple runs)
  cache_signatures: true,

  //Overwrite the snapshot.json in root directory.
  overwrite_snapshot: false,

  //Recalculate wallets table based on already synced
  recalculate_wallets: false,

  //For if parity is syncing but you're testing for a period that you know is already synced.
  skip_web3_sync: false
}
