const Coverage = artifacts.require("Coverage");
const UserInfo = artifacts.require("UserInfo");
const ConversionRate = artifacts.require("ConversionRate");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Coverage);
  deployer.deploy(ConversionRate);
  deployer.deploy(UserInfo);
};
