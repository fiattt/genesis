(#genesis)
## Genesis Block Generator

Simple interface to generate a _genesis block_ from the committed snapshot to this repository. Can be used to generate a genesis block from any properly formatted snapshot.csv.

At present, it will generate a `genesis.json` file 1:1 to snapshot. However, coming soon is the ability to define initial block producers, add account balances and modify other genesis block variables. Many of these options are particularly useful for testnet(s) so that tokens can be allocated for experiementation and for developer faucets. 

The genesis block generator can be accessed [here](http://eosio.github.com/genesis/tools/genesis)