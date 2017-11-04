const Web3 = require('web3'),
      abi  = require('../lib/abi.js')

let web3,
    type = typeof SS_CONFIG_ETHAPI_TYPE!=="undefined" ? SS_CONFIG_ETHAPI_TYPE : null,
    path = typeof SS_CONFIG_ETHAPI_PATH!=="undefined" ? SS_CONFIG_ETHAPI_PATH : null

if(type == 'ipc' && typeof path !== null)
  web3  = new Web3( new Web3.providers.IpcProvider( path, require('net') ) )
else if(type == 'ws')
  web3  = new Web3( path || "ws://localhost:8546" )     //default ws path
else
  web3  = new Web3( path || "http://localhost:8545"  )  //default http rpc path

//Contracts
let contract = {
  $crowdsale: new web3.eth.Contract(abi.crowdsale,  CS_ADDRESS_CROWDSALE),
  $token:     new web3.eth.Contract(abi.token,      CS_ADDRESS_TOKEN),
  $utility:   new web3.eth.Contract(abi.utility,    CS_ADDRESS_UTILITIES)
}

//Some helpers
let collection = {}
collection.transfers = (blockFrom = 0, blockTo = 'latest') => {
  return contract.$token
    .getPastEvents('Transfer', { fromBlock : blockFrom, toBlock : blockTo })
}
collection.buys = (blockFrom = 0, blockTo = 'latest') => {
  return contract.$crowdsale
    .getPastEvents('LogBuy', { fromBlock : blockFrom, toBlock : blockTo })
}
collection.claims = (blockFrom = 0, blockTo = 'latest') => {
  return contract.$crowdsale
    .getPastEvents('LogClaim', { fromBlock : blockFrom, toBlock : blockTo })
}
collection.registrations = (blockFrom = 0, blockTo = 'latest') => {
  return contract.$crowdsale
    .getPastEvents('LogRegister', { fromBlock : blockFrom, toBlock : blockTo })
}

collection.reclaimables = (blockFrom = 0, blockTo = 'latest') => {
  return contract.$token
    .getPastEvents('Transfer', { fromBlock : blockFrom, toBlock : blockTo, filter: { to: [CS_ADDRESS_CROWDSALE,CS_ADDRESS_TOKEN] } } )
}

let user = {}
user.transfersFrom = address => {
  return contract.$token
    .getPastEvents('Transfer', { filter: { from: address } })
}
user.transfersTo = address => {
  return contract.$token
    .getPastEvents('Transfer', { filter: { to: address } } )
}

user.tokenBalance = address => {
  return contract.$token.methods
    .balanceOf( address ).call()
}

user.buys = address => {
  return contract.$utility.methods
    .userBuys( address ).call()
}

user.claims = address => {
  return contract.$utility.methods
    .userClaims( address ).call()
}

user.key = address => {
  return contract.$crowdsale.methods
    .keys( address ).call()
}

module.exports = { web3: web3, contract: contract, query : { user: user, collection: collection } }
