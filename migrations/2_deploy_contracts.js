/* eslint-disable */
const Coverage = artifacts.require("Coverage");
const UserInfo = artifacts.require("UserInfo");
const ConversionRate = artifacts.require("ConversionRate");

module.exports = function(deployer) {
  deployer.deploy(Coverage);
  deployer.deploy(ConversionRate);
};
