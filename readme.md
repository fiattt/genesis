## EOS Snapshot Generator

This tool was created to aggregate the EOS ERC20 token distribution in it's entirety, acknowledge various scenarios, run validation on data and provide files representing balances in various states. 

## Glossary

- **wallet balance** - The wallet balance is refers to an address's EOS ERC20 token balance
- **unclaimed balance** - An unclaimed balance refers to tokens that were never claimed by an address. Despite being unclaimed, these still belong to the contributing address.
- **reclaimed balance** - A reclaimed balance refers to EOS ERC20 tokens accidentally sent to the EOSCrowdsale or EOSToken contract. The balances of these contracts are not included in distribution calculations, so it's imperitive these balances are calculated to have accurate supply values.  
- **total balance** - The sum of **wallet** + **unclaimed** + **reclaimed** balances. The total balance is what is included as a user's balance in snapshots. 
- **registered address** - A registered address is an address with a balance greater than or equal to the `minimum_snapshot_balance** that has correctly registered their ethereum address with the EOSCrowdsale contract using a valid EOS Public Key.
- **unregistered address** - An unregistered address is an address with a balance greater than or equal to the - `minimum_snapshot_balance` that has either incorrectly registered  or failed to register their address with an EOS Public Key.
- **freeze block** - The freeze block is a deterministic value represented by the block number representing the period that tokens were frozen. This block will mark the last block for which actions sent to the crowdsale contract will be honored (such as registrations) 
- **snapshot** - A file containing EOS public keys and balances that can be imported during the EOSIO boot sequence.
- **snapshot-unregistered** - A file containing Ethereum addressees and balances. This file could potentially be imported during the EOSIO boot sequence into the table of a contract that enables Ethereum based claiming.
- **liquid supply** - The liquid supply represents total aggregate EOS ERC20 tokens that are presently in circulation and detected by snapshot script, after the crowdsale ends, the liquid supply should equal the total supply.
- **expected supply** - Expected supply is a mathematically determined value representing what the script expects the liquid supply to equal. Liquid Supply should be within 0.00000001% of expected supply as a result of dust acquired by precision reduction.

## Installation

### Prerequisites

1. MySQL (local or remote) 
2. Parity 1.7.8+
3. [Node 8+](https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions) 

### System requirements

1. 8GB Ram Recommended, can make due with 4gb
2. SSD recommended, NVME to win the race. HDD read/write speeds are intolerably slow with parity. It can increase your parity sync time by 3-4x, and will increase the amount of time for snapshot to process by 2-3x. If you must use HDD, be sure to change the `--db-compaction` parameter for parity to `hdd`, like so: `--db-compaction hdd` 

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

**If you're taking a "final" snapshot**, much of the configuration is automatic. 
- A final snapshot will be taken automatically if the **crowdsale has ended** and the **tokens are frozen**, and will  override configured `period`. Block ranges for the snapshot will be determined by the opening block (first transaction from crowdsale contract) and the *deterministic freeze block*. This is to prevent user error. 

**If you're taking an "ongoing" snapshot,** change "period" to the period for which you would like to generate a snapshot. 
**Note** If you put in a period that hasn't yet completed, the "last closed period" will override your choice. 

Explore the options as defined [here](https://github.com/EOSIO/genesis/wiki/Advanced-Configuration-Options)

### 4. Run the Snapshot

From the *root directory of this project directory*, run the following: 
- `npm install` (first time)
- `node snapshot.js --load_config`

### 5. Connections

1. If MySQL and Parity are running, and Parity is synced, the script will start running. 
2. If either MySQL or Parity are not connecting, it will keep trying every 5 seconds until a connection is established. Double-check your config and that both MySQL and Parity are running. 
2. If Parity is not done syncing, it will tell you so, and let you know how far along it is. Once it's synced, it will continue. 
2. If you encounter an error, see "troubleshooting" 

### 6. Output

#### 6a. Directory Structure
- When complete, the script will output several files into the `./data` directory. 
- Inside the `data` directory, will be a directory named after the period number you generated, for example: `./data/123.` If it's a final snapshot, into the `./data/final` directory. 
- Inside that directory, is directory named after a numerical index. This is so that if you run it multiple times, you don't overwrite another snapshot. 
- This functionality helps with verification of determinism and for development purposes. 

#### 6b. Files
- `snapshot.csv` - This file contains the Ethereum Address, EOS Key and EOS Balance of every address that registered correctly with the contract, and has a balance greater than the value set by `snapshot_minimum_balance` (default:1) 
- `snapshot-unregistered.csv` - This file contains the Ethereum Address and EOS Balance of every address that either failed to register or registered incorrectly with the crowdsale contract.
- `distribution.csv` - This file includes the Ethereum Address and EOS balance of the entire distribution, with no rules or validation imposed. 
- `snapshot.json` - This file contains information about the snapshot-session that created the above files. This file should not be used for verification, but can be used for debugging and to help identify indeterminism.

#### 6c. Snapshot in Root Directory
If `overwrite_snapshot` is set to true, all the above files will be put into the root directory of the project. If you are doing any development on this project, it's suggested that you change this to `false` (it's enabled by default in the `config.default.js` file.) 
