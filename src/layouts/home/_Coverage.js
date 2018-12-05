import React, { Component } from "react";
import PropTypes from "prop-types";

class Coverage extends Component {
  constructor(props, context) {
    super(props);
    this.contracts = context.drizzle.contracts;
  }

  render() {
    return (
      <p>You currently have no coverage plans with us.</p>
    );
  }
}

Coverage.contextTypes = {
  drizzle: PropTypes.object
};

export default Coverage;
