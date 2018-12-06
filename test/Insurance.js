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
    const invalidBooking = "AAAAA";
    const flightInst = await FlightValidity.deployed();
    const userInst = await UserInfo.deployed();
    let response = await flightInst.checkFlightDetails(invalidBooking, `?booking_number=${invalidBooking}`);
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
        bookingNumber: "0x4141414141000000", // ascii of AAAAA
        processStatus: 1 // invalid
      }
    })

    let err = null;
    try {
      await userInst.buyInsurance(invalidBooking, false);
    } catch (error) {
      err = error
    }
    assert.ok(err instanceof Error);
  });

  // These tests will fail after AAAAG expires (01/2019) in the mock API.
  it('should allow buying of insurances for valid tickets', async () => {
    const validBooking = "AAAAG";
    const validBookingAscii = "0x4141414147000000";
    const flightInst = await FlightValidity.deployed();
    const userInst = await UserInfo.deployed();
    let response = await flightInst.checkFlightDetails(validBooking, `?booking_number=${validBooking}`, { value: 1E18});
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
        bookingNumber: validBookingAscii,
        processStatus: 2 // valid
      }
    })

    await userInst.buyInsurance(validBooking, false, { value: 30E18 });
    let insurance = await userInst.getInsurance(validBooking);
    assert.strictEqual(insurance[0], validBookingAscii);
    assert.strictEqual(insurance[1].toNumber(), 0);

    let points = await userInst.getPoints();
    assert.strictEqual(points.toNumber(), 10);

  });

  it('should not allow claiming of insurances for tickets that have normal status', async () => {
    const validBooking = "AAAAG";
    const validBookingAscii = "0x4141414147000000";
    const userInst = await UserInfo.deployed();

    let err = null;
    try {
      await userInst.claimInsurance(validBooking);
    } catch (error) {
      err = error
    }
    assert.ok(err instanceof Error);
  });
});