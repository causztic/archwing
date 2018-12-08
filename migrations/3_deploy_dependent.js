/* eslint-disable */
const FlightValidity = artifacts.require("FlightValidity");
const JsmnSolLib = artifacts.require("jsmnsol-lib/JsmnSolLib");
const UserInfo = artifacts.require("UserInfo");
const ConversionRate = artifacts.require("ConversionRate");

module.exports = function(deployer) {
    deployer.then(async () => {
        await deployer.deploy(JsmnSolLib);
        await deployer.link(JsmnSolLib, FlightValidity);
        await ConversionRate.deployed();
        await FlightValidity.deployed();

        await deployer.deploy(UserInfo, ConversionRate.address, FlightValidity.address, { value: 251E18 });

        return await UserInfo.deployed();
    });
}