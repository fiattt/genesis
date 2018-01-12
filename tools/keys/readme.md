# EOS Genesis Key Utility


An offline EOS key utility built with nodejs and Electron. This utility does two things: 

- Generate a valid EOS keypair
- Validate an existing EOS keypair

This tool is experimental and downloadble binaries are not yet available. 

## Status
- MacOS - Tested, Functional
- Windows - Untested
- Linux - Untested


## Building Binaries Youself

Install dependencies
```bash
npm install
```

Install [electron-packager](https://github.com/electron-userland/electron-packager) globally

```bash
npm install electron-packager
```

Clone the repo

```bash 
git clone https://github.com/EOSIO/genesis.git
```

Navigate to keys directory

```bash
cd genesis/tools/keys
```

Compile for current platform

```bash
npm run compile
```

## Compile for all Platforms

### Building for All Platforms

**Will only compile for all platforms on a mac**

_If running on a mac, you'll need to install xquartz and wine, easiest is through homebrew_

```bash
npm run compile-all
```