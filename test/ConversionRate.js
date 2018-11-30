/* eslint-disable */
require('truffle-test-utils').init();
const ConversionRate = artifacts.require('ConversionRate');

contract('ConversionRate', async (accounts) => {

  it('should get the ETH / SGD pairing from the api', async () => {
    let instance = await ConversionRate.deployed();
    let response = await instance.getConversionToSGD();
    assert.web3Event(response, {
      event: 'LogNewOraclizeQuery',
      args: {
        description: 'Oraclize query was sent, standing by for the answer..'
      }
    });
    // Wait for the callback to be invoked by oraclize and the event to be emitted
    const logNewPriceWatcher = promisifyLogWatch(instance.LogCallback({ fromBlock: 'latest' }));

    log = await logNewPriceWatcher;
    assert.web3Eevent(log, { event: 'LogCallback' });
    assert.isNotNull(log.args.price, 'Price returned was null.');

    console.log(log.args.price);
  });
});

/**
 * Helper to wait for log emission.
 * @param  {Object} _event The event to wait for.
 */
function promisifyLogWatch(_event) {
  return new Promise((resolve, reject) => {
    _event.watch((error, log) => {
      _event.stopWatching();
      if (error !== null)
        reject(error);

      resolve(log);
    });
  });
}