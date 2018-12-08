import React, {Component} from 'react';
import pdfjsLib from 'pdfjs-dist';
import Web3 from 'web3';
import PropTypes from "prop-types";
import { delay } from 'redux-saga';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSync, faSyncAlt, faCross, faCheck
} from "@fortawesome/free-solid-svg-icons";

import { parseTicketPDF } from '../../util/ticket';

const SINGLE_TRIP_PRICE = 2000E18
const ROUND_TRIP_PRICE  = 3000E18

class Ticket extends Component {
  constructor(props, context) {
    super(props);
    this.contracts = context.drizzle.contracts;
    this.state = {
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
      this.props.accounts[0], bookingNumber);
    let i = 0;
    while (i < 20) {
      if (statusDataKey in this.props.contracts.FlightValidity.ticketStatuses) {
        let { processStatus, ticketType } = this.props.contracts.FlightValidity.ticketStatuses[
          statusDataKey
        ].value;
        return { bookingNumber, processStatus, ticketType };
      }
      i++;
      await delay(500);
    }
    return { bookingNumber, processStatus: 0 };
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
          const statuses = bookingNumbers.map(this.pollBookingStatus, this);
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
    // we pad the exchange rate to take care of any last minute conversion rate changes.
    const price = booking.ticketType === 0 ? SINGLE_TRIP_PRICE : ROUND_TRIP_PRICE;
    this.contracts.UserInfo.methods.buyInsurance.cacheSend(booking.bookingNumber,
      loyaltyPoints, { value: price / (this.state.conversionRate - 1000) });
  }

  handleFileChosen = (event) => {
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
          ticketComponent.setState({ ticket1: parseTicketPDF(text) });
          console.log(ticketComponent.state.ticket1);
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
    const bookingNum = Web3.utils.fromAscii(this.state.ticket1.resCode);
    this.contracts.FlightValidity.methods.checkFlightDetails.cacheSend(bookingNum, false, { value: 200000 });
    this.setState({ ticket1: null });
  }

  getBookingStatus = (processStatus) => {
    const processToLabel = ["pending", "invalid", "valid"];
    return processToLabel[processStatus];
  }

  render() {
    let ticketViewer = [];
    if (this.state.syncBookings) {
      ticketViewer = <b>Loading..</b>;
    } else if (this.props.userExists && Array.isArray(this.state.bookings) && this.state.bookings.length) {
      for (let booking of this.state.bookings) {
        const pointReq = booking.ticketType === 0 ? 100 : 150;
        let status = this.getBookingStatus(booking.processStatus);
        let statusLogo = <FontAwesomeIcon icon={faSyncAlt} color="gray" />;
        let pointsStatus = this.props.points >= pointReq ? "valid" : "pending";

        if (status === "invalid") {
          statusLogo = <FontAwesomeIcon icon={faCross} color="red" />;
        } else if (status === "valid") {
          statusLogo = <FontAwesomeIcon icon={faCheck} color="green" />;
        }

        ticketViewer.push(
          <div className="pending-ticket" key={booking.bookingNumber}>
            <div className="booking-number">
              {statusLogo}
              {Web3.utils.toAscii(booking.bookingNumber)}
            </div>
            { status === "valid" ?
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
                  onClick={() => this.insureFor(booking.bookingNumber, true)}
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
                  <b>Single Trip: 20SGD or { SINGLE_TRIP_PRICE / this.state.conversionRate / 1E18 } Ether</b>
                  <br/>
                  <b>Round Trip:  30SGD or { ROUND_TRIP_PRICE / this.state.conversionRate / 1E18 } Ether</b>
                  <br/>
                </>
              }
              <pre>Upload your Ticket PDF</pre>
              <input type="file" onChange={this.handleFileChosen} />
              <button className="pure-button" onClick={this.submitFile} disabled={this.state.ticket1 === null}>
                Submit
              </button>
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