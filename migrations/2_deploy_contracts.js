var CheckValidity = artifacts.require("CheckValidity");
var UserInfo = artifacts.require("UserInfo");

module.exports = function(deployer) {
  deployer.deploy(CheckValidity);
  deployer.deploy(UserInfo);
};
