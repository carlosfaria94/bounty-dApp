const Organisation = artifacts.require('Organisation');
const Parent = artifacts.require('Parent');
const { expectThrow } = require('./helpers/expectThrow');

contract('Parent Tests', async accounts => {
  const owner = accounts[0];
  const alice = accounts[1];

  // Contract instance
  let organisation;
  let parent;

  it('should successfully register an Organisation', async () => {
    parent = await Parent.deployed();
    organisation = await Organisation.deployed();
    await parent.registerOrganisation.sendTransaction(1, organisation.address, {
      from: owner
    });
    let deployedAddr = await parent.getOrganisation(1);
    assert.equal(organisation.address, deployedAddr, 'the address not match');
  });

  it('should throw when geting an Organisation which does not exist', async () => {
    expectThrow(await parent.getOrganisation(5));
  });

  it('should throw when non-owner tries to register contract', async () => {
    expectThrow(
      parent.registerOrganisation.sendTransaction(2, organisation.address, {
        from: alice
      })
    );
  });

  it('should throw when non-owner tries to enable the circuit breaker', async () => {
    expectThrow(
      parent.toggleEntryStorageActive.sendTransaction(1, {
        from: alice
      })
    );
  });

  it('should successfully enable the circuit breaker', async () => {
    await parent.toggleEntryStorageActive.sendTransaction(1, {
      from: owner
    });
  });
});
