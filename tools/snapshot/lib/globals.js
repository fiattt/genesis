const bn = require('bignumber.js')

global.VERSION                            = "0.3.0-testnet"

//Snapshot specific globals.
global.SS_STARTED_TIMESTAMP               = Date.now()/1000 | 0
global.SS_MAINNET_TIMESTAMP_END           = 0 //A cutoff timestamp should be provided so snapshot audits are not impossible. Mainnet snapshot would only account for registrations/claims up to the last block with a timestamp lte this timestamp.
global.SS_ACCEPTABLE_SUPPLY_DEVIATION     = 5 //total number of EOS deviation allowed to be considered an "accurate" snapshot, usually less than 1/-1. 5 is generous.

//Token Globals
global.WAD                                = new bn(1000000000000000000)

//Crowdsale Globals
global.CS_ADDRESS_CROWDSALE               = "0x3b97f02e2a6c6dd5b4c103e60fb556e282002771"
global.CS_ADDRESS_TOKEN                   = "0x27cf49ca4fdafc5394941ab2a6284a563c4139d8"
global.CS_ADDRESS_UTILITIES               = "0x860fd485f533b0348e413e65151f7ee993f93c02"
global.CS_ADDRESS_B1                      = "0x00000000000000000000000000000000000000b1"

global.CS_OPEN_TIME                       = 1521919656
global.CS_START_TIME                      = 1521962856
global.CS_END_TIME                        = 1527893999

global.CS_BLOCK_FIRST                     = 3904416

global.CS_CREATE_FIRST_PERIOD             = new bn(200000000).times(WAD)
global.CS_CREATE_PER_PERIOD               = new bn(2000000).times(WAD)
global.CS_NUMBER_OF_PERIODS               = 7
global.CS_PERIOD_LENGTH_SECONDS           = 12 * 60 * 60 //in seconds
global.CS_PERIOD_ETH                      = []

//Services are global to help avoid extraneous connection bottlenecks.
global.web3
global.mysql
global.redis
