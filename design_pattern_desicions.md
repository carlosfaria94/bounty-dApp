# bounty dApp - Design Patterns & Decisions

## Upgradeability

In this project we separate the data from the logic. The `Parent` contract is responsible for managing `Organisation` contracts that are upgradeable by using permanent storage from `EntryStorage` contract.

By following this pattern it is possible to upgrade the `Organisation` functionality without having the expenses of also to re-deploy the storage.

It is also created an interface (`OrganisationInterface`) to decouple inter contract communication and also avoid the `Parent` to be re-deployed each time there is an upgrade.

This was made possible with this articles:

- [Writing upgradable contracts in Solidity](https://blog.colony.io/writing-upgradeable-contracts-in-solidity-6743f0eecc88)
- [Interfaces make your Solidity contracts upgradeable](https://medium.com/@nrchandan/interfaces-make-your-solidity-contracts-upgradeable-74cd1646a717)

## Fail Early and Fail Loud

Conditions are checked as early as possible (e.g. with `require()`) and throw exceptions if conditions are not met. These pattern reduce unnecessary code execution in the event that an exception will be thrown.

## Restricting Access

Only variables or functions are kept public to only those that require it. It is used function **modifiers** to manage function restrictions and make them more readable.

By using `Ownable` from **OpenZeppelin library** limits the access to certain function to only the owner/creator of the contract.

## Mortal

In order to destroy a contract, it is used the `destroyAndSend(transferAddress)` function in `Destructible` from **OpenZeppelin library**. This function receives one parameter (`transferAddress`) corresponding to the address that will receive all the funds that the contract currently holds.

Only owner/creator of the contract can perform this task.

## Pull over Push Payments

In this project if your _Submission_ is accepted by the _Entry_ owner a bounty is made available to be withdrawn by the submission owner, by calling the `claimBounty(entryId)`.

This design pattern protects against re-entrancy and denial of service attacks.

## Circuit Breaker

This design pattern allow a contract functionality to be stopped. This would be desirable in situations where there is a live contract where a bug has been detected. Freezing the contract would be beneficial for reducing harm before a fix can be implemented.

In this project we can stop the following functionality:

- Creation of new entries;
- Creation of new submissions;
- Accept submissions;
- Claim new bounties.

## State Machine

In this project the `EntryStorage` acts as a state machine. An _Entry_ can have differents states:

```
enum State { Open, Submitted, Done, Canceled }
```

With the use of function modifiers, different functionalities are made available depending on the state of the _Entry_ (e.g. an entry with `Submitted` state cannot be canceled).
