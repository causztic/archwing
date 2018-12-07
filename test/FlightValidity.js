/* eslint-disable */
require('truffle-test-utils').init();
const { promisifyLogWatch } = require("./utils");
const FlightValidity = artifacts.require('FlightValidity');
const UserInfo = artifacts.require('UserInfo');

const checkTicketStatus = (ticketStatus, expectedStatus) => {
  assert.equal(ticketStatus.length, 4);
  assert.equal(expectedStatus.length, 3);
  for (let i = 0; i < 3; i++)
    assert.equal(ticketStatus[i].toNumber(), expectedStatus[i]);
  assert.equal(ticketStatus[3], true);
}

contract('FlightValidity', (accounts) => {
  let flightInst, userInst;
  let defaultAcc;
  let testTickets;
  beforeEach("setup", async () => {
    flightInst = await FlightValidity.deployed();
    userInst = await UserInfo.deployed();
    defaultAcc = accounts[0];
    testTickets = [
      {b: "AAAAG", r: false},  // booking number and return-trip
      {b: "AAAA0", r: false},
      {b: "AAAAA", r: false}
    ]
  })
  
  // this test will not work after AAAAG has expired.
  // can be mitigated by having a fixed unused booking number with a very long age.
  it("should return with valid process status if ticket is valid", async () => {
    await userInst.createUser();
    const ticket = testTickets[0];
    const response = await flightInst.checkFlightDetails(ticket.b, ticket.r, { value: 1E18 });
    assert.web3Event(response, {
      event: 'LogNewOraclizeQuery',
      args: {
        description: 'Oraclize query was sent, standing by for the answer..'
      }
    });

    const logResult = await promisifyLogWatch(
      flightInst.LogTicketStatus({ fromBlock: 'latest' }));
    const eventWrapper = { 'logs': [logResult] }
    assert.web3Event(eventWrapper, {
      event: 'LogTicketStatus',
      args: {
        bookingNumber: "0x4141414147000000",
        processStatus: 2,
        departureTime: 1546407780
      }
    })
    
    const ticketStatus = await flightInst.ticketStatuses(defaultAcc, ticket.b);
    const expectedStatus = [2, 0, 0];
    checkTicketStatus(ticketStatus, expectedStatus);
  })

  it("should return with invalid process status if the ticket does not exist", async () => {
    const ticket = testTickets[1];
    const response = await flightInst.checkFlightDetails(ticket.b, ticket.r, { value: 1E18 });
    assert.web3Event(response, {
      event: 'LogNewOraclizeQuery',
      args: {
        description: 'Oraclize query was sent, standing by for the answer..'
      }
    });

    const logResult = await promisifyLogWatch(
      flightInst.LogTicketStatus({ fromBlock: 'latest' }));
    const eventWrapper = { 'logs': [logResult] }
    assert.web3Event(eventWrapper, {
      event: 'LogTicketStatus',
      args: {
        bookingNumber: "0x4141414130000000",
        processStatus: 1,
        departureTime: 0
      }
    })
    
    const ticketStatus = await flightInst.ticketStatuses(defaultAcc, ticket.b);
    const expectedStatus = [1, 0, 0];
    checkTicketStatus(ticketStatus, expectedStatus);
  })

  it("should return with invalid process status if the ticket has expired", async () => {
    const ticket = testTickets[2];
    const response = await flightInst.checkFlightDetails(ticket.b, ticket.r, { value: 1E18 });
    assert.web3Event(response, {
      event: 'LogNewOraclizeQuery',
      args: {
        description: 'Oraclize query was sent, standing by for the answer..'
      }
    });

    const logResult = await promisifyLogWatch(
      flightInst.LogTicketStatus({ fromBlock: 'latest' }));
    const eventWrapper = { 'logs': [logResult] }
    assert.web3Event(eventWrapper, {
      event: 'LogTicketStatus',
      args: {
        bookingNumber: "0x4141414141000000",
        processStatus: 1,
        departureTime: 1542868560
      }
    })

    const ticketStatus = await flightInst.ticketStatuses(defaultAcc, ticket.b);
    const expectedStatus = [1, 0, 0];
    checkTicketStatus(ticketStatus, expectedStatus);
  })
  
  it("should have 3 tickets in userBookings", async () => {
    const bookings = await flightInst.getBookingNumbers();
    assert.equal(bookings.length, 3);
  })
});
