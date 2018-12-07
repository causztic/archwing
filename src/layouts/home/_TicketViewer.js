import React, { Component } from "react";
import Web3 from "web3";
import PropTypes from "prop-types";

class TicketViewer extends Component {
  constructor(props, context) {
    super(props);
    this.contracts = context.drizzle.contracts;
    this.bookingNumbers = localStorage.getItem("archwing_bookings");

    if (!Array.isArray(this.bookingNumbers)) {
      this.bookingDataKey = this.contracts.FlightValidity.methods.getBookingNumbers.cacheCall();
    }
  }

  waitForBookings = () => {
    if (this.bookingDataKey) {
      if (this.bookingDataKey in this.props.contracts.FlightValidity.getBookingNumbers) {
        const bookingNumbers = this.props.contracts.FlightValidity.getBookingNumbers[
          this.bookingDataKey
        ].value;
        if (bookingNumbers.length > 0) {
          this.bookingNumbers = bookingNumbers;
          localStorage.setItem("archwing_bookings", bookingNumbers);
        }
        this.bookingDataKey = null;
      }
    }
  };

  render() {
    this.waitForBookings();
    let ticketViewer = [];

    if (this.props.userExists && Array.isArray(this.bookingNumbers) && this.bookingNumbers.length) {
      for (let bookingNumber of this.bookingNumbers) {
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
      // for (let i = 0; i < this.s.bookingNumbers.length; i++) {
      //   let statusClass = "invalid";
      //   let status = this.tickets[1][i];

      //   if (status === "0") {
      //     statusClass = "pending";
      //   } else if (status === "2") {
      //     statusClass = "valid";
      //   }


      // }
    } else {
      ticketViewer = <b>You have not uploaded any tickets yet.</b>;
    }

    return (
      <div>
        <h3>Your Tickets</h3>
        <div className="tickets">{ticketViewer}</div>
      </div>
    );
  }
}

TicketViewer.contextTypes = {
  drizzle: PropTypes.object
};

export default TicketViewer;
