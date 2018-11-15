import React, { Component } from 'react'

class Home extends Component {
  render() {
    return (
      <main className="container">
        <div className="pure-g">
          <div className="pure-u-1-1 hero-container">
            <div className="pure-u-1-2 hero">
              <h1 className="header">ARCHWING</h1>
              <p>Flight delay / cancellation insurance distribution app with smart contracts</p>
            </div>
          </div>
          <div className="pure-u-1-1 pure-u-md-1-3 column alternate-column">
            <h2>View Account</h2>
          </div>
          <div className="pure-u-1-1 pure-u-md-1-3 column">
            <h2>Track Flights</h2>
          </div>
          <div className="pure-u-1-1 pure-u-md-1-3 column">
            <h2>Claim Insurance</h2>
          </div>
        </div>
      </main>
    )
  }
}

export default Home
