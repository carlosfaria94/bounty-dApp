var Organisation = artifacts.require('./Organisation.sol');
var Parent = artifacts.require('./Parent.sol');

var EthPriceOracle = artifacts.require('./EthPriceOracle.sol');

module.exports = function(deployer) {
  deployer.deploy(EthPriceOracle);

  var organisationInstance;
  deployer
    .deploy(Organisation)
    .then(function(instance) {
      organisationInstance = instance;
      return deployer.deploy(Parent);
    })
    .then(function(instance) {
      return instance.registerOrganisation.sendTransaction(
        1,
        organisationInstance.address
      );
    })
    .then(function() {
      console.log('Organisation set. First version with storage.');
      return;
    });
};
