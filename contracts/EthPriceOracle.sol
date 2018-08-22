pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";

contract EthPriceOracle is Ownable {
    /**
    * Demonstrates how to create a simple Oracle to get external information about the 
    * Ethereum price in EUR
    * Inspiration: https://kndrck.co/posts/ethereum_oracles_a_simple_guide/ 
    */
    
    // Storage of the ETH Price
    uint256 public ethEurPrice;

    // Callback function
    event CallbackGetEthEurPrice();

    /** 
    * @notice It calls the callback function to get the ETH Price 
    * A external service could run a timer to consistently update the price
    */
    function updateEthEurPrice() public {
        emit CallbackGetEthEurPrice();
    }

    /** 
    * @notice It sets the ETH price. Only the owner of the contract can update the price 
    * It needs to be accessible by a trusted owner, in order to trust the price
    * @param price uint256 ETH price in EUR
    */
    function setEthEurPrice(uint256 price) public onlyOwner() {
        ethEurPrice = price;
    }

    /**
    * @notice Get the ETH price in EUR
    * @return uint256 price ETH price in EUR
    */
    function getEthPrice() public view returns (uint256) {
        return ethEurPrice;
    }
  
}