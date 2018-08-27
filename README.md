# bounty dApp

With this bounty dApp anyone can create a new entry with an associated description, additional file and a bounty in Ethereum to be given.

Anyone can submit their work to the existing entries. The owner of the entry can cancel it at any time. He also can accept the existing works submitted.

The owner of the accepted work can claim the bounty at any time.

## Prerequisites

- [Node.js](https://nodejs.org) 8.11.x
- [NPM](https://npm.org) 5.6.x
- [MetaMask](https://metamask.io/) 4.9.x
- [Python](https://www.python.org) 2.7.x
- [ganache-cli](https://github.com/trufflesuite/ganache-cli) 6.1.x `npm install -g ganache-cli`
- [Truffle](https://truffleframework.com/) 4.1.x `npm install -g truffle`

## Building & Running

1. Go to the project directory and then:

```bash
npm install
```

1. a. Make sure you are running a private Ethereum network with Ganache CLI on `127.0.0.1:8545`:

```bash
ganache-cli
```

Note a list of private keys printed on startup, you will need it later.

2. Compile and migrate project contracts

```bash
truffle compile && truffle migrate
```

3. In your browser login in Metamask to Localhost 8545 and import accounts from the ganache-cli (using the private keys printed on terminal)

4. Start the local server and go to `localhost:4200`

```bash
npm start
```

## Testing

Running the Truffle tests:

```bash
truffle test
```
