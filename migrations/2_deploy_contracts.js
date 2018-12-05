const Coverage = artifacts.require("Coverage");
const UserInfo = artifacts.require("UserInfo");
const ConversionRate = artifacts.require("ConversionRate");
const FlightValidity = artifacts.require("FlightValidity");
const JsmnSolLib = artifacts.require("jsmnsol-lib/JsmnSolLib");

module.exports = function(deployer, network, accounts) {
  if (network == "production") {
    deployer.deploy(JsmnSolLib);
    deployer.deploy(Coverage);
    deployer.deploy(ConversionRate);
    deployer.deploy(UserInfo).then(function() {
      deployer.link(JsmnSolLib, FlightValidity);
      console.log(UserInfo.address);
      deployer.deploy(FlightValidity, UserInfo.address);
    });
  }
};
