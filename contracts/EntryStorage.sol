pragma solidity ^0.4.23;

contract EntryStorage {
    mapping (uint => Entry) public entries;
    uint public entryCount;

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

    constructor() public {
        entryCount = 0;
    }

    function addEntry(
        bytes32 _specDigest,
        uint8 _specHashFunction,
        uint8 _specSize
    ) public payable {
        entryCount = entryCount + 1;

        Multihash memory _specHash = Multihash(_specDigest, _specHashFunction, _specSize);
        Entry memory e;
        e.id = entryCount;
        e.owner = msg.sender;
        e.bounty = msg.value;
        e.specHash = _specHash;
        // This timestamp will not be used for critical contract logic, only as reference
        e.unsafeCreatedTimestamp = block.timestamp;
        e.submissionCount = 0;
        e.state = uint(State.Open);
        e.isBountyCollected = false;
        entries[entryCount] = e;
    }

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

    function cancelEntry(uint _entryId) 
        public 
        entryExist(_entryId)
        isEntryOwner(_entryId, msg.sender)
        isOpen(_entryId) {
        entries[_entryId].state = uint(State.Canceled);
        entries[_entryId].owner.transfer(entries[_entryId].bounty);
    }

    function submit(
        uint _entryId,
        bytes32 _specDigest,
        uint8 _specHashFunction,
        uint8 _specSize
    ) public entryExist(_entryId) {
        Entry storage e = entries[_entryId];
        // Its only possible to submit when an entry state is Open or Submitted
        require(e.state == uint(State.Open) || e.state == uint(State.Submitted));
        e.submissionCount = e.submissionCount + 1;

        Multihash memory _specHash = Multihash(_specDigest, _specHashFunction, _specSize);

        Submission memory newSubmission = Submission(
            e.submissionCount,
            msg.sender,
            _specHash,
            block.timestamp
        );

        e.state = uint(State.Submitted);
        e.submissions[e.submissionCount] = newSubmission;
    }

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

    function acceptSubmission(uint _entryId, uint _submissionId)
        public
        entryExist(_entryId)
        submissionExist(_entryId, _submissionId)
        isEntryOwner(_entryId, msg.sender)
        isSubmitted(_entryId) {
        Entry storage e = entries[_entryId];
        e.state = uint(State.Done);
        e.acceptedSubmission = e.submissions[_submissionId];
    }

    function getAcceptedSubmission(uint _entryId)
        public view
        entryExist(_entryId)
        submissionExist(_entryId, entries[_entryId].acceptedSubmission.id)
        returns (uint, address, uint) {
        return (
            entries[_entryId].acceptedSubmission.id,
            entries[_entryId].acceptedSubmission.owner,
            entries[_entryId].acceptedSubmission.unsafeCreatedTimestamp
        );
    }

    function claimBounty(uint _entryId) 
        public 
        entryExist(_entryId)
        submissionExist(_entryId, entries[_entryId].acceptedSubmission.id)
        isDone(_entryId) {
        Entry storage e = entries[_entryId];
        // Check if bounty has not been collected
        require(e.isBountyCollected == false, "Bounty has already been collected");
        address _acceptedOwner = e.acceptedSubmission.owner;
        require(_acceptedOwner == msg.sender);
        e.isBountyCollected = true;
        _acceptedOwner.transfer(e.bounty);
    }

}