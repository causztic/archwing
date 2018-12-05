const FlightValidity = artifacts.require("FlightValidity");
const JsmnSolLib = artifacts.require("jsmnsol-lib/JsmnSolLib");
const UserInfo = artifacts.require("UserInfo");

module.exports = function(deployer, network, accounts) {
    console.log(UserInfo.address);
    deployer.deploy(JsmnSolLib);
    deployer.link(JsmnSolLib, FlightValidity);
    deployer.deploy(FlightValidity, UserInfo.address);
}