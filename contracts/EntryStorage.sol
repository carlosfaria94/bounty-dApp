pragma solidity ^0.4.23;

contract EntryStorage {
    mapping (uint => Entry) public entries;
    uint public entryCount;

    struct Entry {
        uint id;
        address owner;
        uint bounty;
        // Multihash directoryHash;
        uint unsafeCreatedTimestamp;
        uint submissionCount;
        mapping (uint => Submission) submissions;
        Submission acceptedSubmission;
        uint state;
    }
    
    enum State { Open, Submitted, Done, Canceled }

    struct Submission {
        uint id;
        address owner;
        // Multihash directoryHash;
        uint created;
    }

    struct Multihash {
        bytes32 digest;
        uint8 hashFunction;
        uint8 size;
    }

    constructor() public {
        entryCount = 0;
    }

    function addEntry(
        // bytes32 _directoryDigest,
        // uint8 _directoryHashFunction,
        // uint8 _directorySize
    ) public payable {
        entryCount = entryCount + 1;

        // Multihash memory _directoryHash = Multihash(
        //    _directoryDigest, _directoryHashFunction, _directorySize);
        Entry memory entry;
        entry.id = entryCount;
        entry.owner = msg.sender;
        entry.bounty = msg.value;
        // entry.directoryHash = _directoryHash;
        // This timestamp will not be used for critical contract logic, only as reference
        entry.unsafeCreatedTimestamp = block.timestamp;
        entry.submissionCount = 0;
        entry.state = uint(State.Open);
        entries[entryCount] = entry;
    }

    function getEntry(uint _entryId)
        public view 
        returns (uint, address, uint, uint, uint, uint) {
        Entry storage e = entries[_entryId];
        return(e.id, e.owner, e.bounty, e.unsafeCreatedTimestamp, e.submissionCount, e.state);
    }

    function cancelEntry(uint _entryId) public {
        entries[_entryId].state = uint(State.Canceled);
        entries[_entryId].owner.transfer(entries[_entryId].bounty);
    }

    function submit(
        uint _entryId
        // bytes32 _directoryDigest,
        // uint8 _directoryHashFunction,
        // uint8 _directorySize
    ) public {
        Entry storage e = entries[_entryId];
        e.submissionCount = e.submissionCount + 1;

        // Multihash memory _directoryHash = Multihash(
        //    _directoryDigest, _directoryHashFunction, _directorySize);

        Submission memory newSubmission = Submission(
            e.submissionCount,
            msg.sender,
            // _directoryHash,
            block.timestamp
        );

        e.state = uint(State.Submitted);
        e.submissions[e.submissionCount] = newSubmission;
    }

    function acceptSubmission(uint _entryId, uint _submissionId) public {
        Entry storage e = entries[_entryId];
        e.state = uint(State.Done);
        e.acceptedSubmission = e.submissions[_submissionId];
    }

}