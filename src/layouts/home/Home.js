import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {BigNumber} from 'bignumber.js'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faQuestion, faMedkit, faCoins, faMoneyBill, faChevronDown } from '@fortawesome/free-solid-svg-icons'


class Home extends Component {
  constructor(props, context) {
    super(props);
    this.contracts = context.drizzle.contracts;
    this.state = { points: 0 }
  }

  componentDidMount() {
    // create user and obtain loyalty points
    this.setState( { userExists: this.contracts.UserInfo.methods.userExists.cacheCall() }, () => {
      if (this.state.userExists) {
        this.setState({ points: BigNumber(this.contracts.UserInfo.methods.getPoints.cacheCall()).toString(10) });
      } else {
        this.contracts.UserInfo.methods.createUser.cacheSend();
      }
    });
  }

  render() {
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
              <p>Flight delay / cancellation insurance distribution app with smart contracts</p>
            </div>
            <a href="#instant-coverage">
              <div className="bouncing-arrow"><FontAwesomeIcon icon={faChevronDown} size="lg" /></div>
            </a>
          </div>
          <div className="pure-u-1-1 hero-container" id="instant-coverage">
            <div className="pure-u-1-2 hero">
              <h2>Instant Coverage</h2>
              <h3>Get insured for single or round trips at affordable rates.</h3>
              <a href="/" className="pure-button">Upload Ticket PDF</a>
              <a href="/" className="pure-button">Upload Ticket from Camera</a>
            </div>
            <a href="#loyalty-points">
              <div className="bouncing-arrow"><FontAwesomeIcon icon={faChevronDown} size="lg" /></div>
            </a>
          </div>
          <div className="pure-u-1-1 hero-container" id="loyalty-points">
            <div className="pure-u-1-2 hero">
              <h2>Loyalty Points</h2>
              <h3>Earn AWPoints for every plan you purchase with us.</h3>
              <p>
                You currently have {this.state.points} AWPoints.
              </p>
            </div>
            <a href="#claim-payouts">
              <div className="bouncing-arrow"><FontAwesomeIcon icon={faChevronDown} size="lg" /></div>
            </a>
          </div>
          <div className="pure-u-1-1 hero-container" id="claim-payouts">
            <div className="pure-u-1-2 hero">
              <h2 className="header">Claim Payouts</h2>
              <h3>Near-instant, fuss-free payouts.</h3>
              <p>You currently have no coverage plans with us.</p>
            </div>
          </div>
        </div>
      </main>
    )
  }
}

Home.contextTypes = {
  drizzle: PropTypes.object
}

export default Home
