import React, {Component} from 'react';
import pdfjsLib from 'pdfjs-dist';
import Web3 from 'web3';
import PropTypes from "prop-types";
import { delay } from 'redux-saga';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSync, faSyncAlt, faCheck, faTimesCircle, faTimes
} from "@fortawesome/free-solid-svg-icons";

import { parseTicketPDF } from '../../util/ticket';

// Gas needed for Oraclize and respective callback
const EXTRA_GAS = 4.6E15
const SINGLE_TRIP_PRICE = 2000E18 + EXTRA_GAS
const ROUND_TRIP_PRICE  = 3000E18 + EXTRA_GAS

class Ticket extends Component {
  constructor(props, context) {
    super(props);
    this.contracts = context.drizzle.contracts;
    this.state = {
      returnTrip: false,
      ticket1: null,
      ticket2: null,
      bookings: [],
      syncBookings: true,
      syncPrice: true,
      conversionRate: null
    }
  }

  componentDidMount() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.0.943/pdf.worker.js';
    this.pollConversionRate().then((conversionRate) => {
      console.log(conversionRate);
      this.setState({ conversionRate, syncPrice: false });
    });
    this.pollBookingNumbers().then((bookings) => {
      this.setState({ bookings, syncBookings: false });
    })
  }
  async pollBookingStatus(bookingNumber) {
    const statusDataKey = this.contracts.FlightValidity.methods.ticketStatuses.cacheCall(
      this.props.accounts[0], bookingNumber, 0);
    const statusDataKey2 = this.contracts.FlightValidity.methods.ticketStatuses.cacheCall(
      this.props.accounts[0], bookingNumber, 1);
    let i = 0;

    while (i < 20) {
      if (statusDataKey in this.props.contracts.FlightValidity.ticketStatuses && statusDataKey2 in this.props.contracts.FlightValidity.ticketStatuses) {
        let ticketType = 0;
        let processStatus2 = null;
        let { processStatus } = this.props.contracts.FlightValidity.ticketStatuses[statusDataKey].value;
        console.log(processStatus);
        let { set, processStatus: tempProcessStatus2 } = this.props.contracts.FlightValidity.ticketStatuses[statusDataKey2].value;
        if (set) {
          ticketType = 1;
          processStatus2 = tempProcessStatus2;
        }

        return { bookingNumber, processStatus: [processStatus, processStatus2], ticketType };
      }
      i++;
      await delay(500);
    }
    return { bookingNumber, processStatus: [0, 0], ticketType: 0 };
  }

  async pollBookingNumbers() {
    const bookingDataKey = this.contracts.FlightValidity.methods.getBookingNumbers.cacheCall();
    let i = 0;
    while (i < 20) {
      if (bookingDataKey in this.props.contracts.FlightValidity.getBookingNumbers) {
        let bookingNumbers = this.props.contracts.FlightValidity.getBookingNumbers[
          bookingDataKey
        ].value;
        if (bookingNumbers) {
          const statuses = [...new Set(bookingNumbers)].map(this.pollBookingStatus, this);
          return await Promise.all(statuses);
        } else {
          return [];
        }
      }
      i++;
      await delay(500);
    }
    return [];
  }

  async pollConversionRate() {
    const conversionDataKey = this.contracts.ConversionRate.methods.getConversionToSGD.cacheCall();
    let i = 0;
    while (i < 20) {
      if (conversionDataKey in this.props.contracts.ConversionRate.getConversionToSGD) {
        return this.props.contracts.ConversionRate.getConversionToSGD[
          conversionDataKey
        ].value;
      }
      i++;
      await delay(500);
    }
    return 20000;
  }

  async updatePrice() {
    this.setState({ syncPrice: true });
    let conversionRate = await this.pollConversionRate();
    await delay(1000);
    this.setState({ syncPrice: false });
    console.log(conversionRate);
    this.setState({ conversionRate });
  }

  async updateTickets() {
    this.setState({ syncBookings: true });
    let tickets = await this.pollBookingNumbers();
    await delay(1000);
    this.setState({ syncBookings: false });
    console.log(tickets);
    this.setState({ bookings: tickets});
  }

  async insureFor(booking, loyaltyPoints) {
    const price = parseInt(booking.ticketType) === 0 ? SINGLE_TRIP_PRICE : ROUND_TRIP_PRICE;
    this.contracts.UserInfo.methods.buyInsurance.cacheSend(booking.bookingNumber,
      loyaltyPoints, { value: price / (this.state.conversionRate) });
  }

  handleFileChosen = (event, ticketIndex = 1) => {
    const ticketComponent = this;
    const file = event.target.files[0];

    if (file.type !== 'application/pdf') {
      return null;
    }

    let fileReader = new FileReader();
    fileReader.onload = function() {
      const typedArr = new Uint8Array(this.result);
      pdfjsLib.getDocument(typedArr).then((pdf) => {
        const pagePromise = pdf.getPage(1).then((page) => {
          return page.getTextContent().then((content) => {
            let res = '';
            let lastY = -1;
            content.items.forEach((item) => {
              if (lastY !== item.transform[5]) {
                res += '\n';
                lastY = item.transform[5];
              }
              res += item.str.trim();
            })
            return res;
          });
        });
        return pagePromise.then((text) => {
          if (ticketIndex === 2) {
            ticketComponent.setState({ returnTrip: true });
          }
          ticketComponent.setState({ [`ticket${ticketIndex}`]: parseTicketPDF(text) });
          console.log(ticketComponent.state[`ticket${ticketIndex}`]);
        });
      });
    }

    fileReader.readAsArrayBuffer(file);
  }

  submitFile = () => {
    if (this.state.ticket1 === null) {
      console.log("No file chosen.");
      return;
    }
    if (this.state.returnTrip && this.state.ticket2 === null) {
      console.log("Second file not chosen.");
      return;
    }
    let bookingNum1, bookingNum2;
    bookingNum1 = Web3.utils.fromAscii(this.state.ticket1.resCode);
    if (this.state.returnTrip) {
      bookingNum2 = Web3.utils.fromAscii(this.state.ticket2.resCode);
      if (bookingNum1 !== bookingNum2) {
        alert("The two booking numbers are not the same!");
        return;
      }
    }

    this.contracts.FlightValidity.methods.checkFlightDetails.cacheSend(
      bookingNum1, 0, { value: EXTRA_GAS });
    if (this.state.returnTrip) {
      this.contracts.FlightValidity.methods.checkFlightDetails.cacheSend(
        bookingNum2, 1, { value: EXTRA_GAS });
    }
    this.setState({ ticket1: null, ticket2: null });
  }

  getBookingStatusAndLabel = (processStatus) => {
    const processToLabel = ["pending", "invalid", "valid"];
    let statusLogo = <FontAwesomeIcon icon={faSyncAlt} color="gray" />;

    let status = processToLabel[processStatus];

    if (status === "invalid") {
      statusLogo = <FontAwesomeIcon icon={faTimes} color="red" />;
    } else if (status === "valid") {
      statusLogo = <FontAwesomeIcon icon={faCheck} color="green" />;
    }

    return [statusLogo, status];
  }

  removeReturnTicket = () => {
    this.setState({ ticket2: null, returnTrip: false });
  }

  render() {
    let ticketViewer = [];
    if (this.state.syncBookings) {
      ticketViewer = <b>Loading..</b>;
    } else if (this.props.userExists && Array.isArray(this.state.bookings)
        && this.state.bookings.length) {
      for (let booking of this.state.bookings) {
        const pointReq = booking.ticketType === 0 ? 100 : 150;
        let pointsStatus = this.props.points >= pointReq ? "valid" : "pending";
        let statusLogo2 = null;
        let status2 = null;

        const [statusLogo1, status1] = this.getBookingStatusAndLabel(booking.processStatus[0]);

        if (booking.processStatus[1] !== null) {
          [statusLogo2, status2] = this.getBookingStatusAndLabel(booking.processStatus[1]);
        }

        ticketViewer.push(
          <div className="pending-ticket" key={booking.bookingNumber}>
            <div className="booking-number">
              {statusLogo1}
              {statusLogo2}
              {Web3.utils.toAscii(booking.bookingNumber)}
            </div>
            { status1 === "valid" && (status2 === null || status2 === "valid") ?
              <>
                <button
                  className="pure-button process-status valid"
                  onClick={() => this.insureFor(booking, false)}
                >
                  Get Insured
                </button>
                <button
                  className={`pure-button process-status ${pointsStatus}}`}
                  disabled={pointsStatus === "pending"}
                  onClick={() => this.insureFor(booking, true)}
                >
                  Use AWPoints
                </button>
              </> : null
            }
          </div>
        );
      }
    } else {
      ticketViewer = <b>You have not uploaded any tickets yet.</b>;
    }
    return (
      <>
        <div className="pure-u-3-5 hero">
          <h2>Instant Coverage</h2>
          <h3>
            Get insured for single or round trips at affordable rates.
          </h3>
          {this.props.userLoading ? undefined : !this.props.userExists ? (
            this.props.createAccountButton
          ) :
            (<>
              <h4 className="with-icon">Current Rates: </h4>
              <div className="sync-icon" onClick={() => this.updatePrice()}>
                <FontAwesomeIcon icon={faSync} size="lg" spin={this.state.syncPrice}/>
              </div>
              { this.state.syncPrice ? <b>Updating Price..</b> :
                <>
                  <br/>
                  <b>
                    Single Trip: 20SGD or {
                      SINGLE_TRIP_PRICE / this.state.conversionRate / 1E18
                    } Ether
                  </b>
                  <br/>
                  <b>
                    Round Trip:  30SGD or {
                      ROUND_TRIP_PRICE / this.state.conversionRate / 1E18
                    } Ether
                  </b>
                  <br/>
                </>
              }
              <pre>
                <p>Upload your Ticket PDF</p>
                Note: There is a processing fee for the ticket
              </pre>
              <div className="pure-u-1-2">
                <div className="pure-u-2-5 ticket-label">
                  {this.state.ticket1 ? this.state.ticket1.resCode : <div className="unfilled">Booking Number</div>}
                </div>
                <div className="pure-u-3-5">
                  <input id="uploadFirstTicket" type="file" onChange={this.handleFileChosen} />
                  <label htmlFor="uploadFirstTicket" className="pure-button valid pure-u-1-1">
                    Add First Ticket
                  </label>
                </div>
                <div className="pure-u-2-5 ticket-label">
                  {this.state.ticket2 ? <div>{this.state.ticket2.resCode}<FontAwesomeIcon className="remove-icon" icon={faTimesCircle} onClick={this.removeReturnTicket}></FontAwesomeIcon></div> : <div className="unfilled">Booking Number</div>}
                </div>
                <div className="pure-u-3-5">
                  <input id="uploadReturnTicket" type="file" onChange={(event) => this.handleFileChosen(event, 2)} disabled={this.state.ticket1 === null} />
                  <label htmlFor="uploadReturnTicket" className="pure-button valid pure-u-1-1" disabled={this.state.ticket1 === null}>
                    Add Return Trip Ticket
                  </label>
                </div>
                <button className="pure-button pure-u-1-1 submit-button" onClick={this.submitFile} disabled={this.state.ticket1 === null}>
                  Submit
                </button>
              </div>
            </>)}
        </div>
        <div className="pure-u-3-5 hero">
          <h3 className="with-icon">Your Tickets</h3>
          { !this.props.userLoading && this.props.userExists ?
          <div className="sync-icon" onClick={() => this.updateTickets()}>
            <FontAwesomeIcon icon={faSync} size="lg" spin={this.state.syncBookings}/>
          </div>
          : undefined
          }
          <div className="tickets">{ticketViewer}</div>
        </div>
      </>
    )
  }
}

Ticket.contextTypes = {
  drizzle: PropTypes.object
};

export default Ticket