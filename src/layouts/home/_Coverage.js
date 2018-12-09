import React, { Component } from "react";
import Web3 from "web3";
import { BigNumber } from "bignumber.js";
import { delay } from "redux-saga";
import PropTypes from "prop-types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync } from "@fortawesome/free-solid-svg-icons";

class Coverage extends Component {
  constructor(props, context) {
    super(props);
    this.contracts = context.drizzle.contracts;
    this.state = {
      coverages: {},
      payout: 0,
      syncCoverages: true
    };
  }

  componentDidMount() {
    this.updateCoverages();
  }

  async pollCoverageStatus(bookingNumber, tripIndex) {
    const statusDataKey = this.contracts.UserInfo.methods.getInsurance.cacheCall(
      bookingNumber,
      tripIndex
    );
    let i = 0;
    while (i < 20) {
      if (statusDataKey in this.props.contracts.UserInfo.getInsurance) {
        let result = this.props.contracts.UserInfo.getInsurance[statusDataKey];
        let claimStatus = -1;
        if (result.value) {
          claimStatus = BigNumber(result.value[1]).toNumber();
        }
        return { bookingNumber, claimStatus };
      }
      i++;
      await delay(500);
    }
    return { bookingNumber, tripIndex, claimStatus: 0 };
  }

  async pollFlightStatus(bookingNumber, tripIndex) {
    const statusDataKey = this.contracts.FlightValidity.methods.ticketStatuses.cacheCall(
      this.props.accounts[0],
      bookingNumber,
      tripIndex
    );
    let i = 0;
    while (i < 20) {
      if (statusDataKey in this.props.contracts.FlightValidity.ticketStatuses) {
        let {
          flightStatus,
          set
        } = this.props.contracts.FlightValidity.ticketStatuses[
          statusDataKey
        ].value;
        flightStatus = set ? BigNumber(flightStatus).toNumber() : -1;
        return { bookingNumber, flightStatus };
      }
      i++;
      await delay(500);
    }
    return { bookingNumber, tripIndex, flightStatus: 0 };
  }

  // similar to ticket, but we are getting the flight statuses.
  // user is responsible to update the flight statuses themselves before claiming.
  async pollCoverages() {
    const bookingDataKey = this.contracts.FlightValidity.methods.getBookingNumbers.cacheCall();
    let i = 0;
    while (i < 20) {
      if (
        bookingDataKey in this.props.contracts.FlightValidity.getBookingNumbers
      ) {
        let bookingNumbers = this.props.contracts.FlightValidity
          .getBookingNumbers[bookingDataKey].value;
        if (bookingNumbers) {
          const statuses = bookingNumbers.map(bookingNumber => this.pollFlightStatus(bookingNumber, 0)).concat(bookingNumbers.map(bookingNumber => this.pollFlightStatus(bookingNumber, 1)));
          const coverageMap = bookingNumbers.map(bookingNumber => this.pollCoverageStatus(bookingNumber, 0)).concat(bookingNumbers.map(bookingNumber => this.pollCoverageStatus(bookingNumber, 1)));
          let bookings = await Promise.all(statuses);
          let coverages = await Promise.all(coverageMap);
          return { bookings, coverages };
        } else {
          return [];
        }
      }
      i++;
      await delay(500);
    }
    return [];
  }

  async pollPayouts() {
    const payoutKey = this.contracts.UserInfo.methods.claims.cacheCall(
      this.props.accounts[0]
    );
    let i = 0;
    while (i < 20) {
      if (payoutKey in this.props.contracts.UserInfo.claims) {
        let payout = BigNumber(
          this.props.contracts.UserInfo.claims[payoutKey].value
        ).toNumber();
        return payout;
      }
      i++;
      await delay(500);
    }
    return 0;
  }

  async updateCoverages() {
    this.setState({
      syncCoverages: true
    });
    this.pollCoverages().then(data => {
      let coverages = {};
      if (data.coverages) {
        data.coverages
          .filter(coverage => coverage.claimStatus !== -1)
          .forEach(coverage => {
            let flightStatus = data.bookings.find(
              booking => booking.bookingNumber === coverage.bookingNumber
            ).flightStatus;
            if (flightStatus && flightStatus !== -1) {
              coverages[coverage.bookingNumber] = {
                claimStatus: coverage.claimStatus,
                flightStatus
              };
            }
          });
      }
      this.pollPayouts().then(payout => this.setState({ payout }));
      this.setState({ coverages });
    });
    await delay(1000);
    this.setState({ syncCoverages: false });
  }

  claimInsurance = bookingNumber => {
    this.contracts.UserInfo.methods.claimInsurance.cacheSend(bookingNumber);
  };

  claimPayouts = () => {
    this.contracts.UserInfo.methods.claimPayouts.cacheSend();
  };

  render() {
    let coverageItem = <p>Loading contracts..</p>;
    if (!this.state.syncCoverages) {
      if (Object.keys(this.state.coverages).length !== 0) {
        let coverageRows = [];
        for (let [
          bookingNumber,
          { claimStatus, flightStatus }
        ] of Object.entries(this.state.coverages)) {
          let payoutStatus = true;
          if (claimStatus < 2) {
            if (flightStatus === 2) {
              // cancelled and either claimed for delayed or unclaimed
              payoutStatus = false;
            } else if (flightStatus === 1 && claimStatus === 0) {
              // delayed and unclaimed
              payoutStatus = false;
            }
          }
          let claimButton = (
            <button
              className="pure-button"
              onClick={() => this.claimInsurance(bookingNumber)}
              disabled={payoutStatus}
            >
              Claim Payout
            </button>
          );
          let flightStatusText = "ON SCHEDULE";
          if (flightStatus === 1) {
            flightStatusText = "DELAYED";
          } else if (flightStatus === 2) {
            flightStatusText = "CANCELLED";
          }
          coverageRows.push(
            <tr key={bookingNumber}>
              <td>{Web3.utils.toAscii(bookingNumber)}</td>
              <td>{flightStatusText}</td>
              <td>{claimButton}</td>
            </tr>
          );
        }
        coverageItem = (
          <>
            <table className="pure-table">
              <thead>
                <tr>
                  <th>Booking Reference</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{coverageRows}</tbody>
            </table>
            <button
              className="pure-button valid pure-u-1-1 submit-button"
              onClick={this.claimPayouts}
            >
              Withdraw Payout of {this.state.payout}
            </button>
          </>
        );
      } else {
        coverageItem = <p>You currently have no coverage plans with us.</p>;
      }
    }
    return (
      <>
        <h2 className="header">Claim Payouts</h2>
        <h3 className="with-icon">Near-instant, fuss-free payouts.</h3>
        {!this.props.userLoading && this.props.userExists ? (
          <div className="sync-icon" onClick={() => this.updateCoverages()}>
            <FontAwesomeIcon
              icon={faSync}
              size="lg"
              spin={this.state.syncCoverages}
            />
          </div>
        ) : (
          undefined
        )}
        <br />
        {this.props.userLoading
          ? undefined
          : this.props.userExists
          ? coverageItem
          : this.props.createAccountButton}
      </>
    );
  }
}

Coverage.contextTypes = {
  drizzle: PropTypes.object
};

export default Coverage;
