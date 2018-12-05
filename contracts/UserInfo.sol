pragma solidity ^0.4.24;
import { Coverage } from "./Coverage.sol";

contract ConversionRate {
    function getConversionToSGD() external view returns (uint256) {}
}

contract UserInfo {
    struct Ticket {
        uint256 processStatus;  // 0 - pending, 1 - invalid, 2 - valid
        uint256 ticketType;     // 0 - single, 1 - round-trip
        bool set;
    }

    struct User {
        mapping(bytes8 => Ticket) tickets;
        mapping(bytes8 => Coverage.Insurance) insurances;

        bytes8[] bookingNumbers;
        uint256 points;
        bool set;
    }

    address allowedCaller;
    mapping(address => User) private users;

    function setAllowedCaller(address contractAddr) external {
        require(allowedCaller == address(0), "Allowed caller already set");
        allowedCaller = contractAddr;
    }

    function userExists() external view returns (bool) {
        User storage user = users[msg.sender];
        return user.set;
    }

    function createUser() external {
        User storage user = users[msg.sender];
        // Check that the user did not already exist:
        require(!user.set, "User already exists");
        // Store the user
        users[msg.sender] = User({
            bookingNumbers: new bytes8[](0),
            points: 0,
            set: true
        });
    }

    function getPoints() external view returns (uint256) {
        User storage user = users[msg.sender];
        require(user.set, "User does not exist");

        return user.points;
    }

    // function removePoints(uint256 points) private {
    //     require(points > 0, "Given points is non-positive");
    //     User storage user = users[msg.sender];
    //     require(user.set, "User does not exist");

    //     user.points -= points;
    // }

    // function addPoints(uint256 points) private {
    //     require(points > 0, "Given points is non-positive");
    //     User storage user = users[msg.sender];
    //     require(user.set, "User does not exist");

    //     user.points += points;
    // }

    // TICKETS

    function getTickets() external view returns (bytes8[], uint256[]) {
        User storage user = users[msg.sender];
        require(user.set, "User does not exist");

        bytes8[]  memory bookingNumbers  = new bytes8[](user.bookingNumbers.length);
        uint256[]    memory processStatus = new uint256[](user.bookingNumbers.length);

        for (uint i = 0; i < user.bookingNumbers.length; i++) {
            bookingNumbers[i] = user.bookingNumbers[i];
            Ticket storage ticket = user.tickets[bookingNumbers[i]];
            processStatus[i] = ticket.processStatus;
        }
        return (bookingNumbers, processStatus);
    }

    modifier onlyFlightVal {
        require(msg.sender == allowedCaller, "Invalid caller");
        _;
    }

    function addTicket(bytes8 bookingNum, address userAddr) external onlyFlightVal {
        User storage user = users[userAddr];
        require(user.set, "User does not exist");

        Ticket storage ticket = user.tickets[bookingNum];
        require(!ticket.set, "Ticket already added");
        user.tickets[bookingNum] = Ticket({
            processStatus: 0,
            ticketType: 0,
            set: true
        });
        user.bookingNumbers.push(bookingNum);
    }

    function updateTicket(
        bytes8 bookingNum, uint256 newStatus, address userAddr) external onlyFlightVal {
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

    // INSURANCES
    function getInsurances() external view returns (bytes8[], uint256[]) {
        User storage user = users[msg.sender];
        require(user.set, "User is not set");

        bytes8[] memory bookingNumbers  = new bytes8[](user.bookingNumbers.length);
        uint256[] memory claimStatus = new uint256[](user.bookingNumbers.length);

        for (uint i = 0; i < user.bookingNumbers.length; i++) {
            Coverage.Insurance storage insurance = user.insurances[user.bookingNumbers[i]];
            bookingNumbers[i] = user.bookingNumbers[i];
            claimStatus[i] = insurance.claimStatus;
        }
        return (bookingNumbers, claimStatus);
    }

    function buyInsurance(bytes8 bookingNumber, bool buyWithLoyalty) public payable {
        User storage user = users[msg.sender];
        require(user.set, "User is not set");
        Ticket storage ticket = user.tickets[bookingNumber];
        require(ticket.set, "bookingNumber not found");
        require(ticket.processStatus == 2, "Invalid ticket status");

        if (buyWithLoyalty) {
            uint256 pointsToDeduct = 150;

            if (ticket.ticketType == 0) {
                pointsToDeduct = 100;
            }

            require(user.points >= pointsToDeduct);
            user.points -= pointsToDeduct;
            user.insurances[bookingNumber] = Coverage.Insurance({
                claimStatus: 0,
                set: true
            });
        } else {
            // buy normally
        }
    }
}