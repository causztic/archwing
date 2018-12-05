require('truffle-test-utils').init();
const { promisifyLogWatch } = require("./utils");
const FlightValidity = artifacts.require('FlightValidity');

contract('FlightValidity', () => {
  it("should do stuff", async () => {
    const instance = await FlightValidity.deployed();
    let response = await instance.checkFlightDetails("AAAAA", "?booking_number=AAAAA");
    assert.web3Event(response, {
      event: 'LogNewOraclizeQuery',
      args: {
        description: 'Oraclize query was sent, standing by for the answer..'
      }
    });

    const logResult = await promisifyLogWatch(
      instance.LogCallback({ fromBlock: 'latest' }));
    const logJson = await promisifyLogWatch(
      instance.LogJsonParse({ fromBlock: 'latest' }));
    console.log(logResult);
    console.log(logJson);
  })
});
