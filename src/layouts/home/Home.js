import React, { Component } from "react";
import PropTypes from "prop-types";
import { BigNumber } from "bignumber.js";
import { delay } from 'redux-saga';
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
    this.state = {
      points: 0,
      userLoading: true,
      userExists: false,
      createAccStatus: "none"
    }
    this.contracts = context.drizzle.contracts;
    this.drizzle = context.drizzle;
  }

  componentDidMount() {
    this.pollUser().then((userExists) => {
      this.setState({ userExists, userLoading: false});
      this.pollPoints().then((points) => {
        this.setState({ points });
      });
    })
  }

  async pollUser() {
    const userExistsDataKey = this.contracts.UserInfo.methods.userExists.cacheCall();
    let i = 0;
    while (i < 20) {
      if (userExistsDataKey in this.props.contracts.UserInfo.userExists) {
        return(this.props.contracts.UserInfo.userExists[
          userExistsDataKey
        ].value);
      }
      i++;
      await delay(500);
    }
    return false;
  }

  async pollPoints() {
    const pointDataKey = this.contracts.UserInfo.methods.getPoints.cacheCall();
    let i = 0;
    while (i < 20) {
      if (pointDataKey in this.props.contracts.UserInfo.getPoints) {
        return(BigNumber(
          this.props.contracts.UserInfo.getPoints[pointDataKey].value
        ).toString(10));
      }
      i++;
      await delay(500);
    }
    return 0;
  }

  async createAccount() {
    const stackId = this.contracts.UserInfo.methods.createUser.cacheSend();
    let i = 0;
    while (i < 50) {
      let state = this.drizzle.store.getState();
      if (state.transactionStack[stackId]) {
        const txHash = state.transactionStack[stackId];
        const txStatus = state.transactions[txHash].status;
        if (txStatus === "success") {
          this.setState({createAccStatus: "done"});
          this.setState({userExists: true});
          return;
        } else if (txStatus === "pending") {
          this.setState({createAccStatus: "pending"});
        } else {
          this.setState({createAccStatus: "error"});
        }
      }
      i++;
      await delay(500);
    }
  };

  render() {
    const createAccountButton = (
      <button
        className="pure-button pure-button-primary"
        onClick={this.createAccount.bind(this)}
      >
        Create your account now!
      </button>
    );
    
    const createAccountDiv = () => {
      switch (this.state.createAccStatus) {
        case "none":
          return createAccountButton;
        case "pending":
          return "Creating account...";
        case "done":
          return undefined;
        case "error":
          return "Error creating account";
        default:
          return "WHAT?!";
      }
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
              {this.state.userLoading
                ? undefined
                : this.state.userExists
                ? undefined
                : createAccountDiv()}
            </div>
            <a href="#instant-coverage">
              <div className="bouncing-arrow">
                <FontAwesomeIcon icon={faChevronDown} size="lg" />
              </div>
            </a>
          </div>
          <div className="pure-u-1-1 hero-container" id="instant-coverage">
            <Ticket
              points={this.state.points}
              accounts={this.props.accounts}
              contracts={this.props.contracts} 
              userLoading={this.state.userLoading} 
              userExists={this.state.userExists} 
              createAccountButton={createAccountDiv()}
            />
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
              {this.state.userLoading ? (
                undefined
              ) : this.state.userExists ? (
                <p>You currently have {this.state.points} AWPoints.</p>
              ) : (
                createAccountDiv()
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
              <Coverage
                contracts={this.props.contracts}
                accounts={this.props.accounts}
                userLoading={this.state.userLoading}
                userExists={this.state.userExists}
                createAccountButton={createAccountDiv()}
              />
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
