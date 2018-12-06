/* eslint-disable */
require('truffle-test-utils').init();
const { promisifyLogWatch } = require("./utils");
const FlightValidity = artifacts.require('FlightValidity');
const UserInfo = artifacts.require('UserInfo');

contract('FlightValidity', () => {
  // this test will not work after AAAAG has expired.
  // can be mitigated by having a fixed unused booking number with a very long age.
  it("should return with valid process status if ticket is valid", async () => {
    const flightInst = await FlightValidity.deployed();
    const userInst = await UserInfo.deployed();
    await userInst.createUser();
    let response = await flightInst.checkFlightDetails("AAAAG", { value: 1E18 });
    assert.web3Event(response, {
      event: 'LogNewOraclizeQuery',
      args: {
        description: 'Oraclize query was sent, standing by for the answer..'
      }
    });

    const logResult = await promisifyLogWatch(
      flightInst.LogFlightStatus({ fromBlock: 'latest' }));
    const eventWrapper = { 'logs': [logResult] }
    assert.web3Event(eventWrapper, {
      event: 'LogFlightStatus',
      args: {
        bookingNumber: "0x4141414147000000",
        processStatus: 2,
        departureTime: 1546407780
      }
    })
  })

  it("should return with invalid process status if the ticket does not exist", async () => {
    const flightInst = await FlightValidity.deployed();
    const userInst = await UserInfo.deployed();
    let response = await flightInst.checkFlightDetails("AAAA0", { value: 1E18 });
    assert.web3Event(response, {
      event: 'LogNewOraclizeQuery',
      args: {
        description: 'Oraclize query was sent, standing by for the answer..'
      }
    });

    const logResult = await promisifyLogWatch(
      flightInst.LogFlightStatus({ fromBlock: 'latest' }));
    const eventWrapper = { 'logs': [logResult] }
    assert.web3Event(eventWrapper, {
      event: 'LogFlightStatus',
      args: {
        bookingNumber: "0x4141414130000000",
        processStatus: 1,
        departureTime: 0
      }
    })
  })

  it("should return with invalid process status if the ticket has expired", async () => {
    const flightInst = await FlightValidity.deployed();
    const userInst = await UserInfo.deployed();
    let response = await flightInst.checkFlightDetails("AAAAA", { value: 1E18 });
    assert.web3Event(response, {
      event: 'LogNewOraclizeQuery',
      args: {
        description: 'Oraclize query was sent, standing by for the answer..'
      }
    });

    const logResult = await promisifyLogWatch(
      flightInst.LogFlightStatus({ fromBlock: 'latest' }));
    const eventWrapper = { 'logs': [logResult] }
    assert.web3Event(eventWrapper, {
      event: 'LogFlightStatus',
      args: {
        bookingNumber: "0x4141414141000000",
        processStatus: 1,
        departureTime: 1542868560
      }
    })
  })
});
