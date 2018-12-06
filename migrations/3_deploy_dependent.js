/* eslint-disable */
const FlightValidity = artifacts.require("FlightValidity");
const JsmnSolLib = artifacts.require("jsmnsol-lib/JsmnSolLib");
const UserInfo = artifacts.require("UserInfo");
const ConversionRate = artifacts.require("ConversionRate");

module.exports = function(deployer) {
    deployer.then(async () => {
        await deployer.deploy(JsmnSolLib);
        await deployer.link(JsmnSolLib, FlightValidity);
        await deployer.deploy(UserInfo, ConversionRate.address, { value: 51E18 });
        await deployer.deploy(FlightValidity, UserInfo.address);

        let userInstance = await UserInfo.deployed();
        return userInstance.setAllowedCaller(FlightValidity.address);
    });
}