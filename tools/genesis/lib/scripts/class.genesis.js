class Genesis {

  constructor( snapshot ){
    this.json = {
      "initial_timestamp": "2017-03-30T12:00:00",
        "initial_parameters": {
          "maintenance_interval": 86400,
          "maintenance_skip_slots": 3,
          "maximum_transaction_size": 2048,
          "maximum_block_size": 2048000000,
          "maximum_time_until_expiration": 86400,
          "maximum_producer_count": 1001
        },
        "immutable_parameters": {
          "min_producer_count": 21
        },
        "initial_accounts": []
    }
    this.snapshot = snapshot
    this.accounts()
    this.chainid()
  }

  accounts(){
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

  chainid(){
    this.json.initial_chain_id = "0000000000000000000000000000000000000000000000000000000000000000"
  }

}
