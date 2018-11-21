import React, { Component } from 'react'
import { ContractForm, ContractData } from 'drizzle-react-components'

import bg from './plane-bg.jpg'
import './Home.sass'

class Home extends Component {
  render() {
    return (
      <main className="container">
        <img src={bg} alt='background' className="background-image"></img>
        <div className="pure-g">
          <div className="pure-u-1-1 hero-container">
            <div className="pure-u-1-2 hero">
              <h1 className="header">ARCHWING</h1>
              <p>Flight delay / cancellation insurance distribution app with smart contracts</p>
              <ContractData contract="CheckValidity" method="callback_result" />
              <ContractForm contract="CheckValidity" method="testCheckFlightDetails"/>
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
            <a href="/" className="pure-button">Upload Ticket PDF</a>
            <a href="/" className="pure-button">Upload Ticket from Camera</a>
          </div>
          <div className="pure-u-1-1 pure-u-md-1-3 column">
            <h2>Loyalty Points</h2>
            <h3>Earn AWPoints for every plan you purchase with us.</h3>
            <p>You currently have 0 AWPoints.</p>
          </div>
        </div>
        </div>
      </main>
    )
  }
}

export default Home
