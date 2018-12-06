/* eslint-disable */
require('truffle-test-utils').init();
const { promisifyLogWatch } = require("./utils");
const FlightValidity = artifacts.require('FlightValidity');
const UserInfo = artifacts.require('UserInfo');

contract('Insurance', async (accounts) => {
  it('should get a list of insurances', async () => {
    let instance = await UserInfo.deployed();
    await instance.createUser();
    let insurances = await instance.getInsurances();
    assert.lengthOf(insurances, 2, 'insurances will return booking number and claim status');
  });

  it('should not allow buying of insurances for invalid tickets', async () => {

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
      userInst.LogNewTicket({ fromBlock: 'latest' }));
    const eventWrapper = { 'logs': [logResult] }
    assert.web3Event(eventWrapper, {
      event: 'LogNewTicket',
      args: {
        bookingNumber: "AAAAA",
        processStatus: 1 // invalid
      }
    })
  });
});