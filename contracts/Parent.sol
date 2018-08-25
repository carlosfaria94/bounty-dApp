pragma solidity ^0.4.23;

import "./OrganisationInterface.sol";
import "./EntryStorage.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import { Destructible } from "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";

contract Parent is Ownable, Destructible {
    /*
    Parent is an essential component of the upgradeable design expalined here:
    https://blog.colony.io/writing-upgradeable-contracts-in-solidity-6743f0eecc88
    https://medium.com/@nrchandan/interfaces-make-your-solidity-contracts-upgradeable-74cd1646a717
    
    A Parent is responsible for managing the Organizations, which contain upgradeable smart contract
    entries, and use permanent storage from EntryStorage contract.
    */

    // Emitted when an Organization contract is registered
    event OrganisationCreated(address organisation, uint now);
    // Emitted when an Organization contract is upgraded
    event OrganisationUpgraded(address organisation, uint now);
    // Store the organisation contract addresses
    mapping(bytes32 => address) public organisations;

    /**
    * @notice Maps the entries storage contract to an organization
    * @param key_ bytes32 organization key
    * @param orgAddress address address of the organization
    */
    function registerOrganisation(bytes32 key_, address orgAddress) 
    public onlyOwner() {
        EntryStorage entryStorage = new EntryStorage();

        OrganisationInterface(orgAddress).setDataStore(entryStorage);

        organisations[key_] = orgAddress;
        emit OrganisationCreated(orgAddress, block.timestamp);
    }

    /**
    * @notice Returns the organization address mapped to a given @param key_
    * @param key_ bytes32 organization key
    * @return address address of the organization contract
    */
    function getOrganisation(bytes32 key_) public view returns (address)
    {
        return organisations[key_];
    }

    /**
    * @notice Upgrades organization with a new @param newOrgAddress
    * @param key_ bytes32 organization key
    * @param newOrgAddress address address of the new organization
    */
    function upgradeOrganisation(bytes32 key_, address newOrgAddress) public onlyOwner() {
        address organisationAddress = organisations[key_];
        OrganisationInterface oldOrg = OrganisationInterface(organisationAddress);
        OrganisationInterface newOrg = OrganisationInterface(newOrgAddress);
        address entryStorage = oldOrg.entryStorageAddr();

        newOrg.setDataStore(entryStorage);
        oldOrg.kill(newOrgAddress);

        organisations[key_] = newOrgAddress;
        emit OrganisationUpgraded(newOrgAddress, block.timestamp);
    }

    /** 
    * @notice Circuit breaker to pause storage updates. It still allow entries to be cancelled.
    * @param key_ bytes32 organization key
    */
    function toggleEntryStorageActive(bytes32 key_) public onlyOwner(){
        address organisationAddr = organisations[key_];
        address entryStorageAddr = OrganisationInterface(organisationAddr).entryStorageAddr();
        EntryStorage entryStorage = EntryStorage(entryStorageAddr);
        entryStorage.toggle_active();
    }

    /** @notice Kills this contract and sends remaining ETH to @param transferAddress_
    * @param transferAddress_ address remaining ETH will be sent to
    */
    function kill(address transferAddress_) public
    {
        destroyAndSend(transferAddress_);
    }
}
