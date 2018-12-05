/* eslint-disable */
require('truffle-test-utils').init();
const UserInfo = artifacts.require('UserInfo');

contract('Insurance', async (accounts) => {
  it('should get a list of insurances', async () => {
    let instance = await UserInfo.deployed();
    await instance.createUser();
    let insurances = await instance.getInsurances();
    assert.lengthOf(insurances, 2, 'insurances will return booking number and claim status');
  });

  it('should allow claiming of insurances', async () => {

  });
});