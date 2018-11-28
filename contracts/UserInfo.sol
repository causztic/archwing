pragma solidity ^0.4.24;

contract UserInfo {
    struct User {
        uint256 points;
        bool set;
    }

    mapping(address => User) private users;

    function getPoints() public view returns (uint256) {
        User storage user = users[msg.sender];
        require(user.set, "User is not set");

        return user.points;
    }

    function userExists() public view returns (bool) {
        User storage user = users[msg.sender];
        return user.set;
    }

    function createUser() public {
        User storage user = users[msg.sender];
        // Check that the user did not already exist:
        require(!user.set, "User is already set");
        // Store the user
        users[msg.sender] = User({
            points: 0,
            set: true
        });
    }

    function removePoints(uint256 points) public {
        // TODO: restrict this to contract-contract only
        require(points > 0, "Given points is non-positive");
        User storage user = users[msg.sender];
        require(user.set, "User is not set");

        user.points -= points;
    }

    function addPoints(uint256 points) public {
        // TODO: restrict this to contract-contract only
        require(points > 0, "Given points is non-positive");
        User storage user = users[msg.sender];
        require(user.set, "User is not set");

        user.points += points;
    }
}