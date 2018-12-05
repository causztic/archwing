/* eslint-disable */
require('truffle-test-utils').init();
const { promisifyLogWatch } = require("./utils");
const FlightValidity = artifacts.require('FlightValidity');
const UserInfo = artifacts.require('UserInfo');

contract('FlightValidity', () => {
  it("should return json result from api", async () => {
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
    const eventWrapper = { 'logs': [logResult] }
    assert.web3Event(eventWrapper, {
      event: 'LogCallback',
      args: {
        result: '{"arrival": 1542876120, "booking_number": "AAAAA", ' 
                + '"status": 0, "return": 0, "departure": 1542868560}'
      }
    })
  })
});
