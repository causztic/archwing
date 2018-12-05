const Coverage = artifacts.require("Coverage");
const UserInfo = artifacts.require("UserInfo");
const ConversionRate = artifacts.require("ConversionRate");
const FlightValidity = artifacts.require("FlightValidity");

module.exports = function(deployer) {
  deployer.deploy(Coverage);
  deployer.deploy(ConversionRate);
  deployer.deploy(UserInfo).then(function(ui) {
    deployer.deploy(FlightValidity, ui.address);
  });
};
