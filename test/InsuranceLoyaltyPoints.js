/* eslint-disable */
require('truffle-test-utils').init();

const { promisifyLogWatch } = require("./utils");
const FlightValidity = artifacts.require('FlightValidity');
const UserInfo = artifacts.require('UserInfo');

contract('Insurance', async (accounts) => {
  it('should not allow buying of insurances for valid tickets with loyalty points when too little points', async () => {
    const validBooking = "AAAAI";
    const validBookingAscii = "0x4141414149000000";
    const flightInst = await FlightValidity.deployed();
    const userInst = await UserInfo.deployed();
    await userInst.createUser();
    let response = await flightInst.checkFlightDetails(validBooking, 0, { value: 1E18});
    assert.web3Event(response, {
      event: 'LogNewOraclizeQuery',
      args: {
        description: 'Oraclize query was sent, standing by for the answer..'
      }
    });

    let points = await userInst.getPoints();
    assert.strictEqual(points.toNumber(), 0);

    const logResult = await promisifyLogWatch(
      userInst.LogNewTicket({ fromBlock: 'latest' }));
    const eventWrapper = { 'logs': [logResult] }
    assert.web3Event(eventWrapper, {
      event: 'LogNewTicket',
      args: {
        bookingNumber: validBookingAscii,
        processStatus: 2 // valid
      }
    })

    let err = null;
    try {
      await userInst.buyInsurance(validBooking, true);
    } catch (error) {
      err = error
    }
    assert.ok(err instanceof Error);

  });
});