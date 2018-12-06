/* eslint-disable */
const FlightValidity = artifacts.require("FlightValidity");
const JsmnSolLib = artifacts.require("jsmnsol-lib/JsmnSolLib");
const UserInfo = artifacts.require("UserInfo");
const ConversionRate = artifacts.require("ConversionRate");

module.exports = function(deployer) {
    deployer.deploy(JsmnSolLib);
    deployer.link(JsmnSolLib, FlightValidity);
    deployer.deploy(UserInfo, ConversionRate.address, { value: 51E18}).then(function() {
      return UserInfo.deployed();
    }).then(function(instance) {
        return deployer.deploy(FlightValidity, UserInfo.address).then(function() {
            return instance.setAllowedCaller(FlightValidity.address);
        })
    });
}