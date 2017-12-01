# EOSIO Genesis

Tools used to initialize a genesis block for the EOS Platform

## Tools

- Snapshot Generator ([readme](https://github.com/EOSIO/genesis/tree/master/tools/snapshot)) - Generates a snapshot from the EOS Crowdsale and Token contracts (saves a snapshot.csv and snapshot.json [metadata] into root directory of project)
- [Genesis Block Configurator](https://eosio.github.io/genesis/) ([readme](https://github.com/EOSIO/genesis/tree/master/tools/genesis)) - Enables configuration of a well-formed genesis.json file from a snapshot.csv. 
- _Offline Key Validator (in progress)_
- _Offline Key Generator (in progress)_
- _Simple Look-up Tool (in progress)_
- _Snapshot Frontend (planned)_

## Useful Files
- **snapshot.csv** Comma-delimited list
- **snapshot.json** Meta data for the snapshot in the repo, describes the parameters of snapshot, some statistics and data for debugging
