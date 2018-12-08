import React, {Component} from 'react';
import pdfjsLib from 'pdfjs-dist';
import Web3 from 'web3';
import PropTypes from "prop-types";
import { delay } from 'redux-saga';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSync
} from "@fortawesome/free-solid-svg-icons";

import { parseTicketPDF } from '../../util/ticket';

class Ticket extends Component {
  constructor(props, context) {
    super(props);
    this.contracts = context.drizzle.contracts;
    this.state = {
      ticket1: null,
      ticket2: null,
      bookings: JSON.parse(localStorage.getItem("archwing_bookings")),
      syncing: false,
    }
    this.bookingDataKey = this.contracts.FlightValidity.methods.getBookingNumbers.cacheCall();
    this.conversionDataKey = this.contracts.ConversionRate.methods.getConversionToSGD.cacheCall();
  }

  componentDidMount() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.0.943/pdf.worker.js';
  }

  async pollBookingNumbers() {
    let i = 0;
    while (i < 20) {
      if (this.bookingDataKey in this.props.contracts.FlightValidity.getBookingNumbers) {
        return this.props.contracts.FlightValidity.getBookingNumbers[
          this.bookingDataKey
        ].value;
      }
      i++;
      await delay(500);
    }
    return [];
  }

  async pollConversionRate() {
    let i = 0;
    while (i < 20) {
      if (this.conversionDataKey in this.props.contracts.ConversionRate.getConversionToSGD) {
        return this.props.contracts.ConversionRate.getConversionToSGD[
          this.conversionDataKey
        ].value;
      }
      i++;
      await delay(500);
    }
    return 20000;
  }

  async updateTickets() {
    this.setState({ syncing: true });
    let tickets = await this.pollBookingNumbers();
    this.setState({ syncing: false });
    console.log(tickets);
    localStorage.setItem("archwing_bookings", JSON.stringify(tickets));
    this.setState({ bookings: tickets});
  }

  async insureFor(bookingNumber) {
    // single trip ticket purchase
    let rate = await this.pollConversionRate();
    this.contracts.UserInfo.methods.buyInsurance.cacheSend(bookingNumber, false, { value: 20E18 / rate });
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
    this.contracts.FlightValidity.methods.checkFlightDetails.cacheSend(bookingNum, false);
    this.updateTickets();
    this.setState({ ticket1: null });
  }

  updateTicketsWithGen = () => {
    this.updateTickets();
  }

  render() {
    let ticketViewer = [];
    if (this.props.userExists && Array.isArray(this.state.bookings) && this.state.bookings.length) {
      for (let bookingNumber of this.state.bookings) {
        ticketViewer.push(
          <div className="pending-ticket" key={bookingNumber}>
            <div className="booking-number">
              {Web3.utils.toAscii(bookingNumber)}
            </div>
            <button className="pure-button process-status valid" onClick={() => this.insureFor(bookingNumber)}>Get Insured</button>
            {/* <div className={`process-status ${statusClass}`}>
              {statusClass.toUpperCase()}
            </div> */}
          </div>
        );
      }
    }else {
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
              <pre>Upload your Ticket PDF</pre>
              <input type="file" onChange={this.handleFileChosen} />
              <button className="pure-button" onClick={this.submitFile} disabled={this.state.ticket1 === null}>
                Submit
              </button>
            </>)}
        </div>
        <div className="pure-u-2-5 hero">
          <h3 className="with-icon">Your Tickets</h3>
          { !this.props.userLoading && this.props.userExists ?
          <div className="sync-icon" onClick={this.updateTicketsWithGen}><FontAwesomeIcon icon={faSync} size="lg" spin={this.state.syncing}/></div>
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