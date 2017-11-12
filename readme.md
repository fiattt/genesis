# EOSIO Genesis

Tools used to initialize a genesis block for the EOS Platform

## Tools

- Snapshot Generator ([readme](https://github.com/EOSIO/genesis/tree/master/tools/snapshot)) - Generates a snapshot from the EOS Crowdsale and Token contracts (saves a snapshot.csv and snapshot.json [metadata] into root directory of project)
- Genesis Generator ([readme](https://github.com/EOSIO/genesis/tree/master/tools/genesis)) - Generates a well-formed genesis.json file from a snapshot.csv. _Advanced usage editor for genesis generator is in progress_
- _Offline Key Validator (in progress)_
- _Offline Key Generator (in progress)_
- _Simple Look-up Tool (in progress)_
- _Snapshot Frontend (planned)_

## Snapshots

**There are only two official snapshots.** However, snapshot.csv in this repository will be periodically updated for informational, educational and for purposes of testing.

### Dates
Testnet: Up to a particular period (Exact Period TBD)
Mainnet: ~24+ Hours After ICO Closes (Exact Time/Date TBD)

### Overview
- **snapshot.csv** Comma-delimited list of Ethereum Addresses, EOS claim keys and Balances from which a genesi.json can be generated.
- **snapshot.json** Meta data for the snapshot in the repo, describes the parameters of snapshot, some statistics and data for debugging

