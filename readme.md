## EOS Snapshot Generator

This tool was created to aggregate the EOS ERC20 token distribution in it's entirety, acknowledge various scenarios, run validation on data and provide files representing balances in various states. 

## Installation

### Prerequisites

1. MySQL (local or remote) 
2. Parity 1.7.8+
3. Node

### System requirements

1. 8GB Ram Recommended, can make due with 4gb
2. SSD recommended (NVME to win the race)

### 1. Create Config File

- In the root directory of this project you'll find a `config.default.js` file.
- create a copy and rename the copy `config.js`. The parameters are described in the file, but for your convenience they are also listed below in greater detail. 

### 2. MySQL
MySQL stores all the intricate details of the distribution and the contract. These instructions assume you already have MySQL configured locally or have a remote MySQL instance. 

- Add your mysql details to your newly copied config file. 
- Import `schema.sql` located in the `./bin` directory of this project. 

### 3. Start and Sync Parity

Start parity, **it's imperitive that you start parity with --no-warp**. If you have a pre-existing parity configuration file you've modified, you'll want to create a new configuration file for the snapshot. 

*Sample Config:*

`parity --mode active --tracing off --pruning fast --db-compaction ssd --jsonrpc-apis all --chain mainnet --no-warp`

**Important:** Since Parity v1.7.8 `--warp` is enabled by default. **If you fail to configure with `no-warp` you will have issues.**

### 3. Configure The Snapshot Parameters

**If you're taking a "final" snapshot**, you really don't need to change much. Explore the options as defined [here]()

**If you're taking an "ongoing" snapshot,** change "period" to the period for which you would like to generate a snapshot. 
**Note** If you put in a period that hasn't yet completed, the "last closed period" will override your choice. 

### 4. Run the Snapshot

From the *root directory of this project directory*, run the following: 

`node snapshot.js --load_config` 

### 5. Connections

1. If MySQL and Parity are running, and Parity is synced, the script will start running. 
2. If either MySQL or Parity are not connecting, it will keep trying every 5 seconds until a connection is established. Double-check your config and that both MySQL and Parity are running. 
2. If Parity is not done syncing, it will tell you so, and let you know how far along it is. Once it's synced, it will continue. 
2. If you encounter an error, see "troubleshooting" 

### 6. Output

#### 6a. Directory Structure
- When complete, the script will output several files into the "./data" directory. 
- Inside the `data` directory, will be a directory named after the period number you generated, for example: `./data/123.` If it's a final snapshot, into the `./data/final` directory. 
- Inside that directory, is directory named after an "index." This is so that if you run it multiple times, you don't overwrite another snapshot. This functionality is intended for verification of determinism and for development purposes. 

#### 6b. Files
- `snapshot.csv` - This file contains the Ethereum Address, EOS Key and EOS Balance of every address that registered correctly with the contract, and has a balance greater than the value set by `snapshot_minimum_balance` (default:1) 
- `snapshot-unregistered.csv` - This file contains the Ethereum Address and EOS Balance of every address that either failed to register or registered incorrectly with the crowdsale contract.
- `distribution.csv` - This file includes the Ethereum Address and EOS balance of the entire distribution, with no rules or validation imposed. 
- `snapshot.json` - This file contains information about the snapshot-session that created the above files. This file should not be used for verification, but can be used for debugging and to help identify indeterminism.

#### 6c. Snapshot in Root Directory
If `overwrite_snapshot` is set to true, all the above files will be put into the root directory of the project. If you are doing any development on this project, it's suggested that you change this to `false` (it's enabled by default in the `config.default.js` file.) 
