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

class Home extends Component {
  constructor(props, context) {
    super(props);
    this.points = 0;
    this.userExists = false;
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
      this.points = BigNumber(
        this.contracts.UserInfo.methods.getPoints.cacheCall()
      ).toString(10);
    }
  };

  render() {
    this.checkUserExists();
    const createAccountButton = (
      <button
        className="pure-button pure-button-primary"
        onClick={this.createAccount}
      >
        Create your account now!
      </button>
    );
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
              {this.userExists ? undefined : createAccountButton}
            </div>
            <a href="#instant-coverage">
              <div className="bouncing-arrow">
                <FontAwesomeIcon icon={faChevronDown} size="lg" />
              </div>
            </a>
          </div>
          <div className="pure-u-1-1 hero-container" id="instant-coverage">
            <div className="pure-u-1-2 hero">
              <h2>Instant Coverage</h2>
              <h3>
                Get insured for single or round trips at affordable rates.
              </h3>
              {this.userExists ? (
                <div>
                  <a href="/" className="pure-button">
                    Upload Ticket PDF
                  </a>
                  <a href="/" className="pure-button">
                    Upload Ticket from Camera
                  </a>
                </div>
              ) : (
                createAccountButton
              )}
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
              {this.userExists ? (
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
              {this.userExists ? (
                <p>You currently have no coverage plans with us.</p>
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
