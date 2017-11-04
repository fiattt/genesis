let BigNumber         = require('bignumber.js')
let {web3}  = require('../web3')

class Transaction {

  constructor( type, tx ) {
    // if(typeof tx !== 'object' || !type) return

    let value         = tx.returnValues.value || tx.returnValues.amount

    this.address_to   = tx.returnValues.to || tx.address
    this.address_from = tx.returnValues.from || tx.returnValues.user
    this.hash         = tx.transactionHash
    this.block_number = tx.blockNumber
    this.value        = new BigNumber(value).div(WAD).toFixed(4) //convert to fixed for db consistency

    this.type         = type
    this.confirmed    = false
    this.claimed      = false
    this.data         = null
    this.period       = 0

    this.extract_data(tx)

  }

  confirmation(complete){
    web3.eth.getTransactionReceipt(this.hash)
      .then( tx => ( typeof tx === 'object' ? this.confirmed = true : this.confirmed = false, complete( this ) ) )
  }

  extract_data(tx){
    if(this.type=="register")
      this.data = JSON.stringify({key: typeof tx.returnValues.key === "string" ? tx.returnValues.key.replace(/\W+/g, "") : ""})
    else if(this.type=="future_buy")
      this.data = tx.returnValues.window
  }

  json(){
    return {
      hash:         this.hash,
      block_number: this.block_number,
      address_to:   this.address_to,
      address_from: this.address_from,
      value:        this.value,
      type:         this.type,
      data:         this.data,
      confirmed:    this.confirmed,
      period:       this.period
    }
  }

}

module.exports = Transaction
