import React, { Component } from "react";
import PropTypes from "prop-types";

class Coverage extends Component {
  constructor(props, context) {
    super(props);
    this.contracts = context.drizzle.contracts;
    this.coverageDataKey = this.contracts.UserInfo.methods.getInsurances.cacheCall();
    this.coverageLoading = true;
    this.coverages = [[], []];
  }

  getCoverage = () => {
    if (this.coverageDataKey in this.props.contracts.UserInfo.getInsurances) {
      this.coverages = this.props.contracts.UserInfo.getInsurances[this.coverageDataKey].value;
      this.coverageLoading = false;
    }
  }

  render() {
    this.getCoverage();
    let coverage = <p>Loading contracts..</p>;
    if (!this.coverageLoading) {
      if (this.coverages[0].length !== 0) {
        let coverageRows;
        for (let i = 0; i < this.coverages[0].length; i++) {
          coverageRows += <tr><td>{this.coverages[0][i]}</td><td>{this.coverages[1][i]}</td></tr>
        }
        coverage = (<table>
          <th>
            Booking Reference
          </th>
          <th>
            Status
          </th>
          {coverageRows}
        </table>);
      } else {
        coverage = (<p>You currently have no coverage plans with us.</p>);
      }
    }
    return (
      coverage
    );
  }
}

Coverage.contextTypes = {
  drizzle: PropTypes.object
};

export default Coverage;
