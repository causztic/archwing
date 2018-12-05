pragma solidity ^0.4.24;
import { Coverage } from "./Coverage.sol";

contract UserInfo {
    struct Ticket {
        uint8 processStatus;  // 0 - pending, 1 - invalid, 2 - valid
        bool set;
    }

    struct User {
        mapping(bytes8 => Ticket) tickets;
        mapping(uint256 => Coverage.Insurance) insurances;
        uint256 insuranceSize;
        // LIMITATION: Copying of type struct Coverage.Insurance memory[] memory to storage not yet supported
        // Coverage.Insurance[] insurances;
        uint256 points;
        bool set;
    }
    
    mapping(address => User) private users;

    function userExists() public view returns (bool) {
        User storage user = users[msg.sender];
        return user.set;
    }

    function createUser() public {
        User storage user = users[msg.sender];
        // Check that the user did not already exist:
        require(!user.set, "User already exists");
        // Store the user
        users[msg.sender] = User({
            insuranceSize: 0,
            points: 0,
            set: true
        });
    }

    function getPoints() public view returns (uint256) {
        User storage user = users[msg.sender];
        require(user.set, "User does not exist");

        return user.points;
    }

    function removePoints(uint256 points) private {
        require(points > 0, "Given points is non-positive");
        User storage user = users[msg.sender];
        require(user.set, "User does not exist");

        user.points -= points;
    }

    function addPoints(uint256 points) private {
        // TODO: restrict this to contract-contract only
        require(points > 0, "Given points is non-positive");
        User storage user = users[msg.sender];
        require(user.set, "User does not exist");

        user.points += points;
    }
    
    function addTicket(bytes8 bookingNum, address userAddr) public {
        User storage user = users[userAddr];
        require(user.set, "User does not exist");

        Ticket storage ticket = user.tickets[bookingNum];
        require(!ticket.set, "Ticket already added");
        users[userAddr].tickets[bookingNum] = Ticket({
            processStatus: 0,
            set: true
        });
    }
    
    function updateTicket(
        bytes8 bookingNum, uint8 newStatus, address userAddr) public {
        require(
            newStatus >= 0 && newStatus <= 2,
            "Invalid processing status code for ticket"
        );
        User storage user = users[userAddr];
        require(user.set, "User does not exist");

        Ticket storage ticket = user.tickets[bookingNum];
        require(ticket.set, "Ticket does not exist");
        users[userAddr].tickets[bookingNum].processStatus = newStatus;
    }
}