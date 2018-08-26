pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { Destructible } from "openzeppelin-solidity/contracts/lifecycle/Destructible.sol";
import { Ownable } from "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract EntryStorage is Ownable, Destructible {
    // It prevents overflow issues
    using SafeMath for uint256;
    // It maps the IDs to entries
    mapping (uint256 => Entry) public entries;
    // Number of entries
    uint256 entryCount;
    // Circuit breaker
    bool stopped;

    struct Entry {
        uint id;
        address owner;
        uint bounty;
        Multihash specHash;
        uint unsafeCreatedTimestamp;
        uint submissionCount;
        mapping (uint => Submission) submissions;
        Submission acceptedSubmission;
        uint state;
        bool isBountyCollected;
    }
     
    enum State { Open, Submitted, Done, Canceled }

    struct Submission {
        uint id;
        address owner;
        Multihash specHash;
        uint unsafeCreatedTimestamp;
    }

    struct Multihash {
        bytes32 digest;
        uint8 hashFunction;
        uint8 size;
    }

    // Checks if the entry exist.
    modifier entryExist(uint _entryId) {
        require(entryCount >= _entryId);
        _;
    }

    // Checks if submission exist.
    modifier submissionExist(uint _entryId, uint _submissionId) {
        require(entries[_entryId].submissionCount >= _submissionId);
        _;
    }

    modifier isEntryOwner(uint _entryId, address _address) {
        require(entries[_entryId].owner == _address);
        _;
    }

    // Checks if the entry is in Open state.
    modifier isOpen(uint _entryId) {
        require(entries[_entryId].state == uint(State.Open));
        _;
    }

    // Checks if the entry is in Submitted state.
    modifier isSubmitted(uint _entryId) {
        require(entries[_entryId].state == uint(State.Submitted));
        _;
    }

    // Checks if the entry is in Canceled state.
    modifier isCanceled(uint _entryId) {
        require(entries[_entryId].state == uint(State.Canceled));
        _;
    }

    // Checks if the entry is in Done state.
    modifier isDone(uint _entryId) {
        require(entries[_entryId].state == uint(State.Done));
        _;
    }

    // Stops the execution if stopped is true
    modifier stop_if_emergency() {
        require(!stopped);
        _;
    }

    // Contract constructur which set the circuit breaker to false and entryCount to 0
    constructor() public {
        entryCount = 0;
        stopped = false;
    }

    /**
    * @notice Toggles circuit breaker
    */
    function toggle_active() public onlyOwner() {
        stopped = !stopped;
    }

    /**
    * @notice Adds an entry on the entries persistent storage
    * @param _owner address Entry owner
    * @param _specDigest bytes32 IPFS digest of the entry specification
    * @param _specHashFunction uint8 IPFS hash function of the entry specification
    * @param _specSize uint8 IPFS size of the entry specification
    */
    function addEntry(
        address _owner,
        bytes32 _specDigest,
        uint8 _specHashFunction,
        uint8 _specSize
    ) public payable stop_if_emergency() returns (uint256) {
        entryCount = entryCount.add(1);

        Multihash memory _specHash = Multihash(_specDigest, _specHashFunction, _specSize);
        Entry memory e;
        e.id = entryCount;
        e.owner = _owner;
        e.bounty = msg.value;
        e.specHash = _specHash;
        // This timestamp will not be used for critical contract logic, only as reference
        e.unsafeCreatedTimestamp = block.timestamp;
        e.submissionCount = 0;
        e.state = uint(State.Open);
        e.isBountyCollected = false;
        entries[entryCount] = e;
       
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
    function getEntry(uint _entryId)
        public view 
        entryExist(_entryId)
        returns (uint, address, uint, bytes32, uint8, uint8, uint, uint, uint, bool) {
        Entry storage e = entries[_entryId];
        return(
            e.id,
            e.owner, 
            e.bounty, 
            e.specHash.digest,
            e.specHash.hashFunction,
            e.specHash.size,
            e.unsafeCreatedTimestamp, 
            e.submissionCount, 
            e.state, 
            e.isBountyCollected
        );
    }

    /** 
    * @notice Get entry count
    */
    function getEntryCount() public view returns (uint256) {
        return entryCount;
    }

    /** 
    * @notice Cancel the entry
    * @param _entryId uint256 The entry ID
    * @param _sender address Sender of the transaction. Should be the address of the entry owner
    */
    function cancelEntry(uint256 _entryId, address _sender) 
        public 
        entryExist(_entryId)
        isEntryOwner(_entryId, _sender)
        isOpen(_entryId) {
        entries[_entryId].state = uint(State.Canceled);
        entries[_entryId].owner.transfer(entries[_entryId].bounty);
    }

    /** 
    * @notice Submits to a new entry
    * @param _entryId uint256 The entry ID
    * @param _owner address The submission owner
    * @param _specDigest bytes32 IPFS digest of the submission specification
    * @param _specHashFunction uint8 IPFS hash function of the submission specification
    * @param _specSize uint8 IPFS size of the submission specification
    */
    function submit(
        uint _entryId,
        address _owner,
        bytes32 _specDigest,
        uint8 _specHashFunction,
        uint8 _specSize
    ) public stop_if_emergency() entryExist(_entryId) {
        Entry storage e = entries[_entryId];
        // Its only possible to submit when an entry state is Open or Submitted
        require(e.state == uint(State.Open) || e.state == uint(State.Submitted));
        e.submissionCount = e.submissionCount.add(1);

        Multihash memory _specHash = Multihash(_specDigest, _specHashFunction, _specSize);

        Submission memory newSubmission = Submission(
            e.submissionCount,
            _owner,
            _specHash,
            block.timestamp
        );

        e.state = uint(State.Submitted);
        e.submissions[e.submissionCount] = newSubmission;
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
    function getSubmission(uint _entryId, uint _submissionId)
        public view
        entryExist(_entryId)
        submissionExist(_entryId, _submissionId)
        returns (uint, address, bytes32, uint8, uint8, uint) {
        Submission storage submission = entries[_entryId].submissions[_submissionId];
        return (
            submission.id,
            submission.owner,
            submission.specHash.digest,
            submission.specHash.hashFunction,
            submission.specHash.size,
            submission.unsafeCreatedTimestamp
        );
    }

    /** 
    * @notice Accepts the submission
    * @param _entryId uint256 The entry ID
    * @param _submissionId uint256 The submission ID
    * @param _sender address Sender of the transaction. Should be the address of the entry owner
    */
    function acceptSubmission(uint256 _entryId, uint256 _submissionId, address _sender)
        public
        stop_if_emergency()
        entryExist(_entryId)
        submissionExist(_entryId, _submissionId)
        isEntryOwner(_entryId, _sender)
        isSubmitted(_entryId) {
        Entry storage e = entries[_entryId];
        e.state = uint(State.Done);
        e.acceptedSubmission = e.submissions[_submissionId];
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
    function getAcceptedSubmission(uint _entryId)
        public view
        entryExist(_entryId)
        submissionExist(_entryId, entries[_entryId].acceptedSubmission.id)
        returns (uint, address, bytes32, uint8, uint8, uint) {
        Submission storage acceptedSubmission = entries[_entryId].acceptedSubmission;
        return (
            acceptedSubmission.id,
            acceptedSubmission.owner,
            acceptedSubmission.specHash.digest,
            acceptedSubmission.specHash.hashFunction,
            acceptedSubmission.specHash.size,
            acceptedSubmission.unsafeCreatedTimestamp
        );
    }

    /** 
    * @notice Claims the bounty for a given @param _entryId
    * @param _entryId uint256 The entry ID
    * @param _sender address Sender of the transaction. Should be the address of the entry owner
    */
    function claimBounty(uint _entryId, address _sender) 
        public 
        stop_if_emergency()
        entryExist(_entryId)
        submissionExist(_entryId, entries[_entryId].acceptedSubmission.id)
        isDone(_entryId) {
        Entry storage e = entries[_entryId];
        // Check if bounty has not been collected
        require(e.isBountyCollected == false, "Bounty has already been collected");
        address _acceptedOwner = e.acceptedSubmission.owner;
        require(_acceptedOwner == _sender);
        e.isBountyCollected = true;
        _acceptedOwner.transfer(e.bounty);
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