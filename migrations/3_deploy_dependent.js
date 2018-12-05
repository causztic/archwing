/* eslint-disable */
const FlightValidity = artifacts.require("FlightValidity");
const JsmnSolLib = artifacts.require("jsmnsol-lib/JsmnSolLib");
const UserInfo = artifacts.require("UserInfo");

module.exports = function(deployer) {
    deployer.deploy(JsmnSolLib);
    deployer.link(JsmnSolLib, FlightValidity);
    deployer.deploy(FlightValidity, UserInfo.address).then(function() {
        return UserInfo.deployed();
    }).then(function(instance) {
        return instance.setAllowedCaller(FlightValidity.address);
    });
}