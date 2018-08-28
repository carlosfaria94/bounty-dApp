# bounty dApp

With this bounty dApp anyone can create a new entry with an associated description, additional file and a bounty in Ether to be given.

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

## Client Frontend

The app is made with **Angular 5**. It shows the current user account selected in Metamask and a list of entries registered in the blockchain. There is the option to submit a new entry to the blockchain, and for each entry anyone can submit is work to be accepted by the owner of the entry.

The owner of the entry has a button to cancel the entry, but only if there is no submissions.

The owner of the accepted work has a button to claim their bounty.

The client is always watching for new events on the blockchain:

- New entries
- New submissions
- Entry canceled
- Submission accepted
- Bounty claimed

There is the option to login with uPort (not required) and to get the price of ETH/EUR via an Oracle.

## Contracts

### Parent

The main contract, which serves to register, update or get the `Organisation` contracts which are upgradeable and use permanent storage (`EntryStorage`).

### Organisation

The contract logic of the organisation, which are upgradeable.

### OrganisationInterface

The new functions of the new `Organisation` contract need to be added here.

### EntryStorage

It implements the permanent storage of the entries.

## Circuit breaker & Kill

`Parent` contract has a circuit breaker, when called it pauses all the operations on `EntryStorage` contract.

`Parent`, `Organisation` and `EntryStorage` implements a kill contract option.

More info in [design patterns](https://github.com/carlosfaria94/bounty-dApp/blob/master/design_pattern_desicions.md).

## IPFS

When a new _Entry_ or _Submission_ is created the _specification_ is uploaded to the IPFS and the hash is stored on the blockchain (using [multihash](https://github.com/saurfang/ipfs-multihash-on-solidity)).

The _specification_ of the _Entry_ or _Submission_ contains the _Description_, _Bounty_ in ether and the hash of the _Additional file_ uploaded (also uploaded to IPFS).

With this approach less information is stored on Ethereum (which is expensive to store information).

In order to avoid having to use a local IPFS node, it is used the Infura node with [js-ipfs-api](https://github.com/ipfs/js-ipfs-api) client library.

## uPort

This project use uPort giving users the option to authenticate with the uPort app and attach their name and avatar to any _Entry_ or _Submission_.

## Library Use

This project imports multiple libraries from the [OpenZeppelin](https://openzeppelin.org/): `Ownable`, `Destructible` and `SafeMath`.

### Oracle

This project implements an Oracle that stores the latest ETH/EUR price retrieved from an external source (CoinMarketCap).

## Upgradeable

In this project we separate the data from the logic. The `Parent` contract is responsible for managing `Organisation` contracts that are upgradeable by using permanent storage from `EntryStorage` contract.

By following this pattern it is possible to upgrade the `Organisation` functionality without having the expenses of also to re-deploy the storage.

It is also created an interface (`OrganisationInterface`) to decouple inter contract communication and also avoid the `Parent` to be re-deployed each time there is an upgrade.

This was made possible with this articles:

- [Writing upgradable contracts in Solidity](https://blog.colony.io/writing-upgradeable-contracts-in-solidity-6743f0eecc88)
- [Interfaces make your Solidity contracts upgradeable](https://medium.com/@nrchandan/interfaces-make-your-solidity-contracts-upgradeable-74cd1646a717)

## Testnet deployed (Rinkeby)

EthPriceOracle: [0x2cae03b9bd945a58d9199d2226a7ca4848e0db9d](https://rinkeby.etherscan.io/address/0x2cae03b9bd945a58d9199d2226a7ca4848e0db9d)

Organisation: [0xd55a7ce88fca5789b49fa78df5db62909e6097ba](https://rinkeby.etherscan.io/address/0xd55a7ce88fca5789b49fa78df5db62909e6097ba)

Parent: [0x0c17be160ff2ddeb8044b3989031f13a0c6cee34](https://rinkeby.etherscan.io/address/0x0c17be160ff2ddeb8044b3989031f13a0c6cee34)
