require('truffle-test-utils').init();
const { promisifyLogWatch } = require("./utils");
const FlightValidity = artifacts.require('FlightValidity');
const UserInfo = artifacts.require('UserInfo');

contract('FlightValidity', () => {
  it("should do stuff", async () => {
    const flightInst = await FlightValidity.deployed();
    const userInst = await UserInfo.deployed();
    await userInst.createUser();
    let response = await flightInst.checkFlightDetails("AAAAA", "?booking_number=AAAAA");
    assert.web3Event(response, {
      event: 'LogNewOraclizeQuery',
      args: {
        description: 'Oraclize query was sent, standing by for the answer..'
      }
    });

    const logResult = await promisifyLogWatch(
      flightInst.LogCallback({ fromBlock: 'latest' }));
    const logJson = await promisifyLogWatch(
      flightInst.LogJsonParse({ fromBlock: 'latest' }));
    console.log(logResult);
    console.log(logJson);
  })
});
