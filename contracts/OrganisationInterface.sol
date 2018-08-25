pragma solidity ^0.4.23;

contract OrganisationInterface {
    address public entryStorageAddr;
    function setDataStore(address _entryStrage) public;
    function addEntry(bytes32 _specDigest, uint8 _specHashFunction, uint8 _specSize) public payable returns (uint256);
    function getEntry(uint256 _entryId) public view returns (uint, address, uint, bytes32, uint8, uint8, uint, uint, uint, bool);
    function getEntryCount() public view returns (uint256);
    function cancelEntry(uint256 _entryId) public;
    function submit(uint256 _entryId, bytes32 _specDigest, uint8 _specHashFunction, uint8 _specSize) public;
    function getSubmission(uint256 _entryId, uint256 _submissionId) public view returns (uint, address, bytes32, uint8, uint8, uint);
    function acceptSubmission(uint256 _entryId, uint256 _submissionId) public;
    function getAcceptedSubmission(uint256 _entryId) public view returns (uint, address, bytes32, uint8, uint8, uint);
    function claimBounty(uint256 _entryId) public;
    function kill(address transferAddress_) public;
}