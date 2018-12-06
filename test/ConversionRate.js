/* eslint-disable */
require('truffle-test-utils').init();
const { promisifyLogWatch } = require("./utils");
const ConversionRate = artifacts.require('ConversionRate');

contract('ConversionRate', () => {
  it('should get initial empty ETH / SGD pairing', async () => {
    let instance = await ConversionRate.deployed();
    let price = await instance.getConversionToSGD.call();
    assert.strictEqual(price.toNumber(), 0);
  });

  it('should update ETH / SGD pairing with the api', async () => {
    let instance = await ConversionRate.deployed();
    let response = await instance.updateConversionToSGD({ value: 1E18 });
    assert.web3Event(response, {
      event: 'LogNewOraclizeQuery',
      args: {
        description: 'Oraclize query was sent, standing by for the answer..'
      }
    });
    // Wait for the callback to be invoked by oraclize and the event to be emitted
    const logNewPriceWatcher = promisifyLogWatch(instance.LogCallback({ fromBlock: 'latest' }));
    log = await logNewPriceWatcher;
    const eventWrapper = { 'logs': [log] }
    assert.web3Event(eventWrapper, { event: 'LogCallback' });
    assert.isNotNull(log.args.price, 'Price returned was null.');
  });
});