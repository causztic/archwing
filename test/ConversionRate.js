const ConversionRate = artifacts.require('ConversionRate');

contract('ConversionRate', accounts => {

  it('should get the ETH / SGD pairing from the api', async () => {
    const conversionRate = await ConversionRate.new()
    let response = await conversionRate.getConversionToSGD()

    // Confirm new oraclize query event emitted
    let log = response.logs[0]
    assert.equal(log.event, 'LogNewOraclizeQuery', 'LogNewOraclizeQuery not emitted.')
    assert.equal(log.args.description, 'Oraclize query was sent, standing by for the answer..', 'Incorrect description emitted.')

    // Wait for the callback to be invoked by oraclize and the event to be emitted
    const logNewPriceWatcher = promisifyLogWatch(conversionRate.LogCallback({ fromBlock: 'latest' }));

    log = await logNewPriceWatcher;
    assert.equal(log.event, 'LogCallback', 'LogCallback not emitted.')
    assert.isNotNull(log.args.price, 'Price returned was null.')

    console.log(log.args.price)
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