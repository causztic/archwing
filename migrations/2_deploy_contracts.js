/* eslint-disable */
const Coverage = artifacts.require("Coverage");
const ConversionRate = artifacts.require("ConversionRate");
const FlightValidity = artifacts.require("FlightValidity");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Coverage);
  deployer.deploy(FlightValidity);
  deployer.deploy(ConversionRate).then(function() {
    return ConversionRate.deployed();
  }).then(function(cr) {
    if (network == "production") {
      cr.updateConversionToSGD();
    }
  });
};
