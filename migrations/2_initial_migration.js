var EntryStorage = artifacts.require('./EntryStorage.sol');

module.exports = function(deployer) {
  deployer.deploy(EntryStorage);
};
