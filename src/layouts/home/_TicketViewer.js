import React, {Component} from 'react';
import Web3 from 'web3';
import PropTypes from "prop-types";

class TicketViewer extends Component {
  constructor(props, context) {
    super(props);
    this.contracts = context.drizzle.contracts;
    this.tickets = [[], []];
    this.ticketDataKey = this.contracts.UserInfo.methods.getTickets.cacheCall();
  }

  getTickets = () => {
    if (this.ticketDataKey in this.props.contracts.UserInfo.getTickets) {
      this.tickets = this.props.contracts.UserInfo.getTickets[
        this.ticketDataKey
      ].value;
    }
  };

  render() {
    this.getTickets();
    let ticketViewer = [];

    if (this.props.userExists && this.tickets && this.tickets[0].length > 0) {
      for (let i = 0; i < this.tickets[0].length; i++) {
        let statusClass = "invalid";
        let status = this.tickets[1][i];

        if (status === "0") {
          statusClass = "pending";
        } else if (status === "2") {
          statusClass = "valid";
        }

        ticketViewer.push(
          <div className="pending-ticket" key={this.tickets[0][i]}>
            <div className="booking-number">
              {Web3.utils.toAscii(this.tickets[0][i])}
            </div>
            <div className={`process-status ${statusClass}`}>{statusClass.toUpperCase()}</div>
          </div>
        );
      }
    } else {
      ticketViewer = <b>You have not uploaded any tickets yet.</b>;
    }

    return (
      <div>
        <h3>Your Tickets</h3>
        <p>Refresh the page to update the status.</p>
        <div className="tickets">
          {ticketViewer}
        </div>
      </div>
    )
  }
}

TicketViewer.contextTypes = {
  drizzle: PropTypes.object
};

export default TicketViewer