import React, {Component} from 'react';
import pdfjsLib from 'pdfjs-dist';
import Web3 from 'web3';
import PropTypes from "prop-types";

import { parseTicketPDF } from '../../util/ticket';

class Ticket extends Component {
  constructor(props, context) {
    super(props);
    this.contracts = context.drizzle.contracts;
    this.state = {
      ticket1: null,
      ticket2: null
    }
  }

  componentDidMount() {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.0.943/pdf.worker.js';
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

    let bookings = localStorage.getItem("archwing_bookings");
    if (bookings === null) {
      localStorage.setItem("archwing_bookings", [bookingNum]);
    } else {
      bookings.push(bookingNum);
      localStorage.setItem("archwing_bookings", bookings);
    }

    this.contracts.FlightValidity.methods.checkFlightDetails.cacheSend(bookingNum);
    this.setState({ ticket1: null });
  }

  render() {
    return (
      <div>
        <pre>Upload your Ticket PDF</pre>
        <input type="file" onChange={this.handleFileChosen} />
        <button className="pure-button" onClick={this.submitFile} disabled={this.state.ticket1 === null}>
          Submit
        </button>
      </div>
    )
  }
}

Ticket.contextTypes = {
  drizzle: PropTypes.object
};

export default Ticket