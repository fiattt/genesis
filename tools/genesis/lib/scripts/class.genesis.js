class Genesis {

  constructor( snapshot ){
    this.json = {}
    this.snapshot = snapshot
  }

  set( options ){
    this.options = options
  }

  build( args ){
    this.timestamp()
    this.initial_parameters()
    this.immutable_parameters()
    this.initial_accounts()
    this.additional_accounts()
    this.initial_producers()
    this.chainid()
    this.append_to_initial_accounts()
  }

  initial_parameters(){
    this.options.initial_parameters = this.options.initial_parameters || []
    const default = {
      "maintenance_interval": 86400,
      "maintenance_skip_slots": 3,
      "maximum_transaction_size": 2048,
      "maximum_block_size": 2048000000,
      "maximum_time_until_expiration": 86400,
      "maximum_producer_count": 1001
    },
    this.json.initial_parameters = default.concat( default )
  }

  immutable_parameters(){
    this.json.immutable_parameters = {
      "min_producer_count": 21
    }
  }

  timestamp( ){
    this.json.initial_timestamp = this.options.initial_timestamp || "2017-03-30T12:00:00"
  }

  initial_producers(){
    this.json.initial_producers = this.options.initial_producers || []
  }

  initial_accounts( additiona ){
    if(this.snapshot) {
      this.json.initial_accounts = this.snapshot.map( user => {
        let eth = user.eth.replace(/"/g, '')
        return {
          "name": eth.substr(eth.length-12),
          "owner_key": user.eos.replace(/"/g, ''),
          "active_key": user.eos.replace(/"/g, ''),
          "liquid_balance": `${user.balance.replace(/"/g, '')
        } EOS`} } )
    }
  }

  additional_accounts(){
    this.options.initial_accounts = this.options.initial_accounts || []
    this.json.initial_accounts = this.json.initial_accounts.concat( this.options.initial_accounts )
  }

  chainid(){
    this.json.initial_chain_id = "0000000000000000000000000000000000000000000000000000000000000000"
  }

}
