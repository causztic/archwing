pragma solidity ^0.4.24;

contract UserInfo {
    struct User {
        int256 points;
        bool set;
    }

    mapping(address => User) private users;

    function getPoints() public view returns (int256) {
        User storage user = users[msg.sender];
        require(user.set);

        return user.points;
    }

    function createUser() public {
        User storage user = users[msg.sender];
        // Check that the user did not already exist:
        require(!user.set);
        //Store the user
        users[msg.sender] = User({
            points: 0,
            set: true
        });
    }
}