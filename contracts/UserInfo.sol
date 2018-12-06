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

    address private allowedCaller;
    address private owner;
    ConversionRate private cr;

    mapping(address => User) private users;
    event LogNewTicket(bytes8 bookingNumber, uint256 processStatus);

    constructor(address conversionAddr) public payable {
        require(msg.value > 50 ether);
        owner = msg.sender;
        cr = ConversionRate(conversionAddr);
    }

    modifier onlyFlightVal {
        require(msg.sender == allowedCaller, "Invalid caller");
        _;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

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
        ticket.processStatus = newStatus;
        emit LogNewTicket(bookingNum, ticket.processStatus);
    }

    // INSURANCES
    function getInsurance(bytes8 bookingNumber) external view returns (bytes8, uint256) {
        User storage user = users[msg.sender];
        require(user.set, "User is not set");

        Coverage.Insurance storage insurance = user.insurances[bookingNumber];
        require(insurance.set, "Insurance not found.");

        return (bookingNumber, insurance.claimStatus);
    }

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

    function buyInsurance(bytes8 bookingNumber, bool buyWithLoyalty) external payable {
        User storage user = users[msg.sender];
        require(user.set, "User is not set");
        Ticket storage ticket = user.tickets[bookingNumber];
        require(ticket.set, "bookingNumber not found");
        require(ticket.processStatus == 2, "Invalid ticket status");
        require(!user.insurances[bookingNumber].set, "You cannot buy multiple insurances for the same booking number");

        if (buyWithLoyalty) {
            uint256 pointsToDeduct = 150;

            if (ticket.ticketType == 0) {
                pointsToDeduct = 100;
            }
            require(user.points >= pointsToDeduct);
            user.points -= pointsToDeduct;
        } else {
            // buy normally.
            uint256 cost = 30e18;
            // in SGD, multiplied by the nomination of wei. this way we can do division without floating points as accurately as possible

            if (ticket.ticketType == 0) {
               cost = 20e18;
            }

            // ideally we should poll for the updated exchange rate here
            uint256 price = cr.getConversionToSGD();
            assert(price > 0);

            // e.g. price is 15000 for $150 per ether.
            // if $30, $30/$150 would be 0.2 ether. to avoid floating points, we do 30*(1e18-1e15)/150 = 200 finney == 0.2 ether.
            // with this reasoning, we can do 30e18/150 to obtain the same value in wei.
            cost = cost / price;
            // ensure that the company has enough to pay for the cancelled tickets.
            // we are assuming only one insurance is bought for the entire DApp.
            // Otherwise, we'll need to calculate the total number of insurances bought and the cap needed etc etc.
            require((5000e18 / price) <= getBalance(), "Company is broke! Don't buy from us.");
            require(cost <= msg.value, "Not enough money!");

            // give points when you use cash. do this at the end to prevent re-entrancy attacks.
            if (ticket.ticketType == 0) {
                user.points += 10;
            } else {
                user.points += 30;
            }
        }
        user.insurances[bookingNumber] = Coverage.Insurance({
            claimStatus: 0,
            set: true
        });
    }

    function startClaimInsurance(bytes8 bookingNumber) external view {
        User storage user = users[msg.sender];
        require(user.set, "User is not set");
        Coverage.Insurance storage insurance =  user.insurances[bookingNumber];
        require(insurance.set, "Insurance not found.");
    }
}