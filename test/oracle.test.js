const EthPriceOracle = artifacts.require('EthPriceOracle');
const { expectThrow } = require('./helpers/expectThrow');

contract('EthPriceOracle Tests', async accounts => {
  const owner = accounts[0];
  const alice = accounts[1];

  const price = 222;

  // Contract instance
  let oracle;

  it('should throw when geting the price which is not set', async () => {
    let newOracle = await EthPriceOracle.deployed();
    expectThrow(await newOracle.getEthPrice());
  });

  it('should successfully update the price', async () => {
    oracle = await EthPriceOracle.deployed();
    await oracle.setEthEurPrice.sendTransaction(price, {
      from: owner
    });
    let priceUpdated = await oracle.getEthPrice();
    assert.equal(price, priceUpdated, 'the price not match');
  });

  it('should throw when non-owner tries to update the price', async () => {
    expectThrow(
      oracle.setEthEurPrice.sendTransaction(price, {
        from: alice
      })
    );
  });
});
