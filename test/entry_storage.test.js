const EntryStorage = artifacts.require('EntryStorage');
const { expectThrow } = require('./helpers/expectThrow');

contract('EntryStorage Tests', async accounts => {
  const owner = accounts[0];
  const alice = accounts[1];
  const bob = accounts[2];
  const emptyAddress = '0x0000000000000000000000000000000000000000';

  let oneEther = web3.toWei(1, 'ether');
  let twoEther = web3.toWei(1, 'ether');

  // Contract instance
  let entryStorage;

  it('should have 0 entries on deploy.', async () => {
    entryStorage = await EntryStorage.new();
    let entryCount = await entryStorage.entryCount();
    assert.equal(entryCount.toNumber(), 0, 'initial entry count incorrect.');
  });

  it('should throw when geting an entry which does not exist', async () => {
    expectThrow(entryStorage.getEntry(69));
  });

  it('should successfully add an entry', async () => {
    // Create an entry and bounty amount should be deducted from the owner that add the entry
    let account_one_starting_balance = await web3.eth.getBalance(owner);

    const tx_hash = await entryStorage.addEntry.sendTransaction({
      value: oneEther,
      from: owner
    });
    const receipt = await web3.eth.getTransactionReceipt(tx_hash);
    const tx = await web3.eth.getTransaction(tx_hash);
    const gasCost = tx.gasPrice.mul(receipt.gasUsed);

    let account_owner_ending_balance = await web3.eth.getBalance(owner);
    let account_owner_ending_balance_check = account_one_starting_balance.minus(
      gasCost
    );
    account_owner_ending_balance_check = account_owner_ending_balance_check.minus(
      oneEther
    );

    const result = await entryStorage.getEntry.call(1);
    const actual_id = result[0];
    const actual_owner = result[1];
    const actual_state = result[5].toNumber();

    assert.equal(
      account_owner_ending_balance.toNumber(),
      account_owner_ending_balance_check.toNumber(),
      'bounty amount of the new entry is not correctly taken from the owner'
    );
    assert.equal(actual_id, 1, 'the id of the new entry should be 1');
    assert.equal(
      actual_state,
      0,
      'the state of the new entry should be "Open", which should be declared first in the State Enum'
    );
    assert.equal(
      actual_owner,
      owner,
      'the owner of the new entry does not match with the transaction owner'
    );
  });

  it('should exist one entry', async () => {
    let entryCount = await entryStorage.entryCount();
    assert.equal(entryCount.toNumber(), 1, 'should exist only one entry.');
  });

  it('should successfully submit twice to the entry', async () => {
    await entryStorage.submit.sendTransaction(1, { from: alice });
    await entryStorage.submit.sendTransaction(1, { from: bob });

    const result = await entryStorage.getEntry.call(1);
    const actual_submission_count = result[4].toNumber();
    const actual_state = result[5].toNumber();

    assert.equal(
      actual_submission_count,
      2,
      'the entry should only have 2 submissions'
    );
    assert.equal(
      actual_state,
      1,
      'the state of the entry should be "Submitted"'
    );
  });
});
