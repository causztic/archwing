import React, { Component } from 'react'
import PropTypes from 'prop-types'
import {BigNumber} from 'bignumber.js'

import TicketModal from './_TicketModal'
import bg from './plane-bg.jpg'
import './Home.sass'

class Home extends Component {
  constructor(props, context) {
    super(props);
    this.contracts = context.drizzle.contracts;
    this.state = {
      points: 0,
      showModal: false
    }
  }
  
  showModal = () => {
    this.setState({ showModal: true });
  }
  
  hideModal = () => {
    this.setState({ showModal: false });
  }

  componentDidMount() {
    // create user and obtain loyalty points
    let userInfoMethods = this.contracts.UserInfo.methods
    this.setState({
      userExists: userInfoMethods.userExists.cacheCall()
    }, () => {
      if (this.state.userExists) {
        this.setState({
          points: BigNumber(userInfoMethods.getPoints.cacheCall()).toString(10)
        });
      } else {
        this.contracts.UserInfo.methods.createUser.cacheSend();
      }
    });
  }

  render() {
    return (
      <main className="container">
        <img src={bg} alt='background' className="background-image"></img>
        <div className="pure-g">
          <div className="pure-u-1-1 hero-container">
            <div className="pure-u-1-2 hero">
              <h1 className="header">ARCHWING</h1>
              <p>Flight delay / cancellation insurance distribution app with smart contracts</p>
            </div>
          </div>
        <div className="pure-u-1-1 actions">
          <div className="pure-u-1-1 pure-u-md-1-3 column">
            <h2>Claim Payouts</h2>
            <h3>Near-instant, fuss-free payouts.</h3>
            <p>You currently have no coverage plans with us.</p>
          </div>
          <div className="pure-u-1-1 pure-u-md-1-3 column">
            <h2>Instant Coverage</h2>
            <h3>Get insured for single or round trips at affordable rates.</h3>
            <TicketModal show={this.state.showModal} handleClose={this.hideModal} />
            <p>
              <button className="pure-button" onClick={this.showModal}>Get started now!</button>
            </p>
          </div>
          <div className="pure-u-1-1 pure-u-md-1-3 column">
            <h2>Loyalty Points</h2>
            <h3>Earn AWPoints for every plan you purchase with us.</h3>
            <p>
              You currently have {this.state.points} AWPoints.
            </p>
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
