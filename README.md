# Archwing
An Ethereum distributed app that manages insurance for travelers.

## Requirements
| Software       | Description                                                                                       |
|----------------|---------------------------------------------------------------------------------------------------|
| Node v11       | We recommend [node version manager](https://github.com/creationix/nvm) to change version          |
| NPM v6         | Used to install other necessary modules                                                           |
| Python v2.7.14 | Used in `npm install`, we recommend using [pyenv](https://github.com/pyenv/pyenv) to install      |
| Metamask       | Ethereum wallet, we recommend the Chrome plugin [here](https://metamask.io/)                      |
| Ganache        | Private blockchain, use `npm install -g ganache-cli` for CLI, or [use this](https://truffleframework.com/ganache) for GUI          |
| Truffle        | Ethereum development suite, use `npm install -g truffle` to install                               |


## Setup
If you are using node version manager,
```sh
nvm install 11
nvm use 11
```

If you are using pyenv,
```sh
pyenv install -v 2.7.14
```

To start up the server and client,
```sh
npm install
ganache-cli  # or start up Ganache GUI
truffle compile
truffle migrate
npm run start
```

After starting up the server:

1. Head to localhost:3000 and logout from any existing Metamask account

2. Switch network to private network eg. localhost:8545 (Ganache's default)
    <br><img src="images/metamask_networks.png" width="200">

3. Restore account in Metamask with Ganache's mnemonic 
    via "Import using account seed phrase"
    <br><img src="images/metamask_seed.png" width="200">

4. Login to Metamask using the above restored account

5. Approve the connection


## Testing
```sh
truffle test  # for contract testing
npm run test  # for React testing
```


## Building
```sh
npm run build
```
