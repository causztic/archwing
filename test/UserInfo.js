/* eslint-disable */
require('truffle-test-utils').init();
const UserInfo = artifacts.require('UserInfo');

contract('UserInfo', () => {
  it('should not allow re-set allowedCaller', async () => {
    let instance = await UserInfo.deployed();
    let err = null;
    try {
      await instance.setAllowedCaller(address(1));
    } catch (error) {
      err = error
    }
    assert.ok(err instanceof Error);
  })
  
  it('should create a new user when not created yet', async () => {
    let instance = await UserInfo.deployed();
    userExists = await instance.userExists();
    assert.isFalse(userExists);

    await instance.createUser();
    userExists = await instance.userExists();
    assert.isTrue(userExists);
  });

  it('should not allow re-creation of same user', async () => {
    let instance = await UserInfo.deployed();
    userExists = await instance.userExists();
    assert.isTrue(userExists);

    let err = null;
    try {
      await instance.createUser();
    } catch (error) {
      err = error
    }
    assert.ok(err instanceof Error)
  });
});