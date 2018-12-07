import React, {Component} from 'react';
import pdfjsLib from 'pdfjs-dist';
import Web3 from 'web3';
import PropTypes from "prop-types";
import { delay } from 'redux-saga';
import { call } from 'redux-saga/effects';
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
  }

  componentDidMount() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.0.943/pdf.worker.js';
  }

  *pollContract() {
    console.log("here");
    let dataKey = this.contracts.FlightValidity.methods.getBookingNumbers.cacheCall();
    let i = 0;
    while (i < 20) {
      if (dataKey in this.props.contracts.FlightValidity.getBookingNumbers) {
        return this.props.contracts.FlightValidity.getBookingNumbers[
          dataKey
        ].value;
      }
      i++;
      yield delay(500);
    }
    return [];
  }

  *updateTickets() {
    this.setState({ syncing: true });
    let obj = yield call(this.pollContract);
    this.setState({ syncing: false });
    if (obj.value.length > 0) {
      localStorage.setItem("archwing_bookings", JSON.stringify(obj.value));
      this.setState({ bookings: obj.value});
    }
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

    if (this.state.bookings === null) {
      this.setState({ bookings: [bookingNum] });
      localStorage.setItem("archwing_bookings", JSON.stringify([bookingNum]));
    } else {
      this.setState({ bookings: [...this.state.bookings, bookingNum] });
      localStorage.setItem("archwing_bookings", JSON.stringify(this.state.bookings));
    }

    this.contracts.FlightValidity.methods.checkFlightDetails.cacheSend(bookingNum, false);
    this.setState({ ticket1: null });
  }

  updateTicketsWithGen = () => {
    this.updateTickets().next();
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
          <div className="sync-icon" onClick={this.updateTicketsWithGen}><FontAwesomeIcon icon={faSync} size="lg" spin={this.state.syncing} /></div>
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