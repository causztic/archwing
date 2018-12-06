pragma solidity ^0.4.24;

import { Coverage } from "./Coverage.sol";
import { FlightValidity } from "./FlightValidity.sol";
import { ConversionRate } from "./ConversionRate.sol";

contract UserInfo {
    struct User {
        mapping(bytes8 => Coverage.Insurance) insurances;
        uint256 points;
        bool set;
    }

    ConversionRate private cr;
    FlightValidity private fv;

    mapping(address => User) private users;
    mapping(address => uint) claims;

    constructor(address conversionAddr, address flightAddr) public payable {
        require(msg.value > 50 ether);
        cr = ConversionRate(conversionAddr);
        fv = FlightValidity(flightAddr);
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
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
            points: 0,
            set: true
        });
    }

    function getPoints() external view returns (uint256) {
        User storage user = users[msg.sender];
        require(user.set, "User does not exist");

        return user.points;
    }

    // TICKETS

    // function getTickets() external view returns (bytes8[], uint256[]) {
    //     User storage user = users[msg.sender];
    //     require(user.set, "User does not exist");

    //     bytes8[]  memory bookingNumbers  = new bytes8[](user.bookingNumbers.length);
    //     uint256[]    memory processStatus = new uint256[](user.bookingNumbers.length);

    //     for (uint i = 0; i < user.bookingNumbers.length; i++) {
    //         bookingNumbers[i] = user.bookingNumbers[i];
    //         Ticket storage ticket = user.tickets[bookingNumbers[i]];
    //         processStatus[i] = ticket.processStatus;
    //     }
    //     return (bookingNumbers, processStatus);
    // }

    // INSURANCES
    function getInsurance(bytes8 bookingNumber) external view returns (bytes8, uint256) {
        User storage user = users[msg.sender];
        require(user.set, "User is not set");

        Coverage.Insurance storage insurance = user.insurances[bookingNumber];
        require(insurance.set, "Insurance not found.");

        return (bookingNumber, insurance.claimStatus);
    }

    // function getInsurances() external view returns (bytes8[], uint256[]) {
    //     User storage user = users[msg.sender];
    //     require(user.set, "User is not set");

    //     bytes8[] memory bookingNumbers  = new bytes8[](user.bookingNumbers.length);
    //     uint256[] memory claimStatus = new uint256[](user.bookingNumbers.length);

    //     for (uint i = 0; i < user.bookingNumbers.length; i++) {
    //         Coverage.Insurance storage insurance = user.insurances[user.bookingNumbers[i]];
    //         bookingNumbers[i] = user.bookingNumbers[i];
    //         claimStatus[i] = insurance.claimStatus;
    //     }
    //     return (bookingNumbers, claimStatus);
    // }

    function buyInsurance(bytes8 bookingNumber, bool buyWithLoyalty) external payable {
        User storage user = users[msg.sender];
        require(user.set, "User is not set");
        (uint8 processStatus, uint8 ticketType, uint8 _flightStatus, bool set) = fv.tickets(msg.sender, bookingNumber);
        require(set, "bookingNumber not found");
        require(processStatus == 2, "Invalid ticket status");
        require(!user.insurances[bookingNumber].set, "You cannot buy multiple insurances for the same booking number");

        if (buyWithLoyalty) {
            uint256 pointsToDeduct = 150;

            if (ticketType == 0) {
                pointsToDeduct = 100;
            }
            require(user.points >= pointsToDeduct);
            user.points -= pointsToDeduct;
        } else {
            // buy normally.
            uint256 cost = 30e18;
            // in SGD, multiplied by the nomination of wei. this way we can do division without floating points as accurately as possible

            if (ticketType == 0) {
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
            if (ticketType == 0) {
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

    // We follow this tutorial to ensure safe transfers to avoid re-entrancy and attacks discussed in class.
    // https://consensys.github.io/smart-contract-best-practices/recommendations/#favor-pull-over-push-for-external-calls
    function claimInsurance(bytes8 bookingNumber) {
        User storage user = users[msg.sender];
        require(user.set, "User is not set");
        (uint8 _processStatus, uint8 _ticketType, uint8 status, bool _set) = fv.tickets(msg.sender, bookingNumber);
        Coverage.Insurance storage insurance = user.insurances[bookingNumber];
        require(insurance.set, "Insurance not found.");
        require(status == 1 || status == 2, "Cannot claim flights that are on schedule.");
        // ideally we should poll for the updated exchange rate here
        uint256 price = cr.getConversionToSGD();
        uint256 payout;
        assert(price > 0);
        if (status == 1 && insurance.claimStatus == 0) {
            // unclaimed delayed flight, add to claims
            payout = 200e18 / price;
            insurance.claimStatus += 1;
        } else if (status == 2) {
            if (insurance.claimStatus == 0) {
                // cancelled flight, add 5k to claims
                payout = 5000e18 / price;
                insurance.claimStatus += 1;
            } else if (insurance.claimStatus == 1) {
                // delayed flight became cancelled, add the remaining 4.8k to claims
                payout = 4800e18 / price;
                insurance.claimStatus += 1;
            }
            // insurance.claimStatus > 1, means cancelled flight has been claimed.
        }
        // status = 0 is normal and cannot be claimed.
        // status == 1 && insurance.claimStatus > 1, means delayed flight has been claimed.
        claims[msg.sender] += payout;
    }

    function claimPayouts() external {
        uint payout = claims[msg.sender];
        claims[msg.sender] = 0; // clear the payouts before sending over
        msg.sender.transfer(payout);
    }
}