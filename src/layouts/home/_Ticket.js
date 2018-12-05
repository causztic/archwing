import React from 'react';
import pdfjsLib from 'pdfjs-dist';
import Web3 from 'web3';

import { parseTicketPDF, constructQuery } from '../../util/ticket';

class Ticket extends React.Component {
  constructor(props) {
    super(props);
    this.flightValidity = this.props.flightValidity;
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
    const queryStr = constructQuery(this.state.ticket1);
    console.log(bookingNum);
    console.log(queryStr);
    this.flightValidity.methods.checkFlightDetails.cacheSend(bookingNum, queryStr);
  }

  render() {
    return (
      <div>
        <input type="file" onChange={this.handleFileChosen} />
        <button className="pure-button" onClick={this.submitFile}>
          Submit
        </button>
      </div>
    )
  }
}

export default Ticket