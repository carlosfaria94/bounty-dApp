pragma solidity ^0.4.23;

import "./EntryStorage.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Destructible } from "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";

contract Organisation is Destructible {
    /**
    * The organization can be upgradeable.
    * In this contract you can upgrade functionality which uses separate storage.
    */

    // It prevents overflow issues
    using SafeMath for uint256;

    // Address of external storage contract
    address public entryStorageAddr;

    // Emitted when new Entry addedd
    event EntryAdded(uint256 indexed id);
    // Emitted when exist a new submission
    event Submitted(uint256 indexed entryId);
    // Emitted when an Entry submission is accepted
    event SubmissionAccepted(uint256 indexed submissionId);
    // Emitted when an Entry is cancelled
    event EntryCancelled(uint256 indexed entryId);

    /**
    * @notice Sets the address of the EntryStorage contract
    * @param _entryStorageAddr address Address of storage contract
    */
    function setDataStore(address _entryStorageAddr) public {
        entryStorageAddr = _entryStorageAddr;
    }

    /**
    * @notice Adds an entry on the entries persistent storage
    * @param _specDigest bytes32 IPFS digest of the entry specification
    * @param _specHashFunction uint8 IPFS hash function of the entry specification
    * @param _specSize uint8 IPFS size of the entry specification
    */
    function addEntry(bytes32 _specDigest, uint8 _specHashFunction, uint8 _specSize) 
    public payable returns (uint256) {
        EntryStorage entryStorage = EntryStorage(entryStorageAddr);
        uint256 entryCount = entryStorage.addEntry.value(msg.value)(msg.sender, _specDigest, _specHashFunction, _specSize);
        emit EntryAdded(entryCount);
        return entryCount;
    }

    /**
    * @notice Gets the entry from the EntryStorage contract
    * @param _entryId uint256 The entry ID
    * @return uint Entry id
    * @return address Entry owner
    * @return uint Entry bounty
    * @return bytes32 IPFS digest of the entry specification
    * @return uint8 IPFS hash function of the entry specification
    * @return uint8 IPFS size of the entry specification
    * @return uint Entry created timestamp
    * @return uint Entry number of submissions
    * @return uint Entry state
    * @return bool Is bounty has been collected
    */
    function getEntry(uint256 _entryId) 
    public view returns (uint, address, uint, bytes32, uint8, uint8, uint, uint, uint, bool) {
        EntryStorage entryStorage = EntryStorage(entryStorageAddr);
        return entryStorage.getEntry(_entryId);
    }

    /** 
    * @notice Get entry count
    */
    function getEntryCount() public view returns (uint256) {
        EntryStorage entryStorage = EntryStorage(entryStorageAddr);
        return entryStorage.getEntryCount();
    }

    /** 
    * @notice Cancel the entry
    * @param _entryId uint256 The entry ID
    */
    function cancelEntry(uint256 _entryId) public {
        EntryStorage entryStorage = EntryStorage(entryStorageAddr);
        entryStorage.cancelEntry(_entryId, msg.sender);
        emit EntryCancelled(_entryId);
    }

    /** 
    * @notice Submits to a new entry
    * @param _entryId uint256 The entry ID
    * @param _specDigest bytes32 IPFS digest of the submission specification
    * @param _specHashFunction uint8 IPFS hash function of the submission specification
    * @param _specSize uint8 IPFS size of the submission specification
    */
    function submit(
        uint256 _entryId,
        bytes32 _specDigest,
        uint8 _specHashFunction,
        uint8 _specSize
    ) public {
        EntryStorage entryStorage = EntryStorage(entryStorageAddr);
        entryStorage.submit(_entryId, msg.sender, _specDigest, _specHashFunction, _specSize);
        emit Submitted(_entryId);
    }

    /**
    * @notice Gets the submission from the EntryStorage contract
    * @param _entryId uint256 The entry ID
    * @param _submissionId uint256 The submission ID
    * @return uint Submission id
    * @return address Submission owner
    * @return bytes32 IPFS digest of the submission specification
    * @return uint8 IPFS hash function of the submission specification
    * @return uint8 IPFS size of the submission specification
    * @return uint Submission created timestamp
    */
    function getSubmission(uint256 _entryId, uint256 _submissionId) 
    public view returns (uint, address, bytes32, uint8, uint8, uint) {
        EntryStorage entryStorage = EntryStorage(entryStorageAddr);
        return entryStorage.getSubmission(_entryId, _submissionId);
    }

    /** 
    * @notice Accepts the submission
    * @param _entryId uint256 The entry ID
    * @param _submissionId uint256 The submission ID
    */
    function acceptSubmission(uint256 _entryId, uint256 _submissionId) public {
        EntryStorage entryStorage = EntryStorage(entryStorageAddr);
        entryStorage.acceptSubmission(_entryId, _submissionId, msg.sender);
        emit SubmissionAccepted(_submissionId);
    }

    /** 
    * @notice Get entry accepted submission
    * @param _entryId uint256 The entry ID
    * @return uint Submission id
    * @return address Submission owner
    * @return bytes32 IPFS digest of the submission specification
    * @return uint8 IPFS hash function of the submission specification
    * @return uint8 IPFS size of the submission specification
    * @return uint Submission created timestamp
    */
    function getAcceptedSubmission(uint256 _entryId)
        public view
        returns (uint, address, bytes32, uint8, uint8, uint) {
        EntryStorage entryStorage = EntryStorage(entryStorageAddr);
        return entryStorage.getAcceptedSubmission(_entryId);
    }

    /** 
    * @notice Claims the bounty for a given @param _entryId
    * @param _entryId uint256 The entry ID
    */
    function claimBounty(uint256 _entryId) public {
        EntryStorage entryStorage = EntryStorage(entryStorageAddr);
        entryStorage.claimBounty(_entryId, msg.sender);
    }

    /** 
    * @notice Kills this contract and sends remaining ETH to @param transferAddress_
    * @param transferAddress_ address remaining ETH will be sent to
    */
    function kill(address transferAddress_) public
    {
        destroyAndSend(transferAddress_);
    }
}