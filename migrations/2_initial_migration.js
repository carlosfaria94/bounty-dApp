var EntryStorage = artifacts.require('./EntryStorage.sol');
var EthPriceOracle = artifacts.require('./EthPriceOracle.sol');

module.exports = function(deployer) {
  deployer.deploy(EntryStorage);
  deployer.deploy(EthPriceOracle);
};
