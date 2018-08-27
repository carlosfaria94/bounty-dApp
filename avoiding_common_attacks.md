# Measures taken to avoid common attacks

There are [common attacks](https://consensys.github.io/smart-contract-best-practices/known_attacks/) which need closer attention when building smart contracts. A series of measures was taken into account to avoid these common attacks.

## Race Conditions

### Reentrancy

This attack is mitigated by performing internal work first and then call external contracts.

### Cross-function

_(Similar to above)_
This attack is mitigated by performing internal work first and then call external contracts.

## Transaction-Ordering Dependence (TOD) / Front Running

This attack is not an issue to this project. Therefore, the intervention of the miners on the order of the transactions is an important issue to take into account for the future improvements on this project.

## Timestamp dependence

Timestamps of blocks can be manipulated by the miner.

This project uses `block.timestamp` to know when _Entry_ or _Submission_ was added. It can tolerate 30 second window.

## Integer Overflow and Underflow

This project use `SafeMath` from **OpenZeppelin library** which has math operations with safety checks that throw on error.

## DoS with (Unexpected) revert & Block Gas Limit

In this project it is used [pull payments pattern](https://github.com/carlosfaria94/bounty-dApp/blob/master/design_pattern_desicions.md#pull-over-push-payments) to avoid these DoS attacks.

## Forcibly Sending Ether to a Contract

In this project it is not used the contract balance.

## Logic Bugs

Simple programming mistakes can cause the contract to behave differently to its stated rules, especially on 'edge cases'.

In this project this attack is mitigated by:

- Running tests against the contracts
- Following Solidity coding standards and general coding best practices for safety-critical software
- Avoiding overly complex rules (even at the cost of some functionality) or complicated implementation (even at the cost of some gas)

## Exposed Secrets

In this project contracts do not rely on any secret information.

## Tx.Origin Problem

In this project it is not used the `tx.origin`.
