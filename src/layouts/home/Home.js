import Web3 from 'web3';
import React, { Component } from "react";
import PropTypes from "prop-types";
import { BigNumber } from "bignumber.js";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faQuestion,
  faMedkit,
  faCoins,
  faMoneyBill,
  faChevronDown
} from "@fortawesome/free-solid-svg-icons";
import Coverage from "./_Coverage";

import Ticket from "./_Ticket";

class Home extends Component {
  constructor(props, context) {
    super(props);
    this.points = 0;
    this.userLoading = true;
    this.userExists = false;
    this.tickets = [[], []];

    this.contracts = context.drizzle.contracts;
    this.userExistsDataKey = this.contracts.UserInfo.methods.userExists.cacheCall();
  }

  createAccount = () => {
    this.contracts.UserInfo.methods.createUser.cacheSend();
  };

  checkUserExists = () => {
    if (this.userExistsDataKey in this.props.contracts.UserInfo.userExists) {
      this.userExists = this.props.contracts.UserInfo.userExists[
        this.userExistsDataKey
      ].value;
      this.userLoading = false;

      let pointDataKey = this.contracts.UserInfo.methods.getPoints.cacheCall();
      if (pointDataKey in this.props.contracts.UserInfo.getPoints) {
        this.points = BigNumber(
          this.props.contracts.UserInfo.getPoints[pointDataKey].value
        ).toString(10);
      }
    }
  };

  getTickets = () => {
    this.ticketDataKey = this.contracts.UserInfo.methods.getTickets.cacheCall();
    if (this.ticketDataKey in this.props.contracts.UserInfo.getTickets) {
      this.tickets = this.props.contracts.UserInfo.getTickets[
        this.ticketDataKey
      ].value;
    }
  };

  render() {
    this.checkUserExists();
    this.getTickets();

    const createAccountButton = (
      <button
        className="pure-button pure-button-primary"
        onClick={this.createAccount}
      >
        Create your account now!
      </button>
    );

    let ticketViewer = [];

    if (this.userExists && this.tickets && this.tickets[0].length > 0) {
      for (let i = 0; i < this.tickets[0].length; i++) {
        let statusClass = "invalid";
        let status = this.tickets[1][i];

        if (status === "0") {
          statusClass = "pending";
        } else if (status === "1") {
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
      <main className="container">
        <div className="anchor-menu">
          <a href="#archwing">
            <FontAwesomeIcon icon={faQuestion} />
          </a>
          <a href="#instant-coverage">
            <FontAwesomeIcon icon={faMedkit} />
          </a>
          <a href="#loyalty-points">
            <FontAwesomeIcon icon={faCoins} />
          </a>
          <a href="#claim-payouts">
            <FontAwesomeIcon icon={faMoneyBill} />
          </a>
        </div>
        <div className="pure-g">
          <div className="pure-u-1-1 hero-container" id="archwing">
            <div className="pure-u-1-2 hero">
              <h1 className="header">ARCHWING</h1>
              <p>
                Flight delay / cancellation insurance distribution app with
                smart contracts
              </p>
              {this.userLoading
                ? undefined
                : this.userExists
                ? undefined
                : createAccountButton}
            </div>
            <a href="#instant-coverage">
              <div className="bouncing-arrow">
                <FontAwesomeIcon icon={faChevronDown} size="lg" />
              </div>
            </a>
          </div>
          <div className="pure-u-1-1 hero-container" id="instant-coverage">
            <div className="pure-u-3-5 hero">
              <h2>Instant Coverage</h2>
              <h3>
                Get insured for single or round trips at affordable rates.
              </h3>
              {this.userLoading ? (
                undefined
              ) : this.userExists ? (
                <Ticket contracts={this.props.contracts} />
              ) : (
                createAccountButton
              )}
            </div>
            <div className="pure-u-2-5 hero">
              <h3>Your Tickets</h3>
              {ticketViewer}
            </div>
            <a href="#loyalty-points">
              <div className="bouncing-arrow">
                <FontAwesomeIcon icon={faChevronDown} size="lg" />
              </div>
            </a>
          </div>
          <div className="pure-u-1-1 hero-container" id="loyalty-points">
            <div className="pure-u-1-2 hero">
              <h2>Loyalty Points</h2>
              <h3>Earn AWPoints for every plan you purchase with us.</h3>
              {this.userLoading ? (
                undefined
              ) : this.userExists ? (
                <p>You currently have {this.points} AWPoints.</p>
              ) : (
                createAccountButton
              )}
            </div>
            <a href="#claim-payouts">
              <div className="bouncing-arrow">
                <FontAwesomeIcon icon={faChevronDown} size="lg" />
              </div>
            </a>
          </div>
          <div className="pure-u-1-1 hero-container" id="claim-payouts">
            <div className="pure-u-1-2 hero">
              <h2 className="header">Claim Payouts</h2>
              <h3>Near-instant, fuss-free payouts.</h3>
              {this.userLoading ? (
                undefined
              ) : this.userExists ? (
                <Coverage contracts={this.props.contracts} />
              ) : (
                createAccountButton
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }
}

Home.contextTypes = {
  drizzle: PropTypes.object
};

export default Home;
