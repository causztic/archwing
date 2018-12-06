pragma solidity ^0.4.24;

import { Coverage } from "./Coverage.sol";
import { FlightValidity } from "./FlightValidity.sol";
import { ConversionRate } from "./ConversionRate.sol";

contract UserInfo {
    // price in SGD, multiplied by the nomination of wei
    // this way we can do division without floating points as accurately as possible
    uint256 constant ROUNDTRIP_PRICE_SGD = 30e18;
    uint256 constant SINGLETRIP_PRICE_SGD = 20e18;
    // price in loyalty points
    uint256 constant ROUNDTRIP_PRICE_POINTS = 150;
    uint256 constant SINGLETRIP_PRICE_POINTS = 100;
    // points reward for purchase
    uint256 constant ROUNDTRIP_REWARD_POINTS = 30;
    uint256 constant SINGLETRIP_REWARD_POINTS = 10;
    // payout for insurance
    uint256 constant DELAYED_PAYOUT = 200e18;
    uint256 constant CANCELLED_PAYOUT = 5000e18;

    struct User {
        mapping(bytes8 => Coverage.Insurance) insurances;
        uint256 points;
        bool set;
    }

    ConversionRate private cr;
    FlightValidity private fv;

    mapping(address => User) private users;
    mapping(address => uint) claims;
    uint256 numInsurances;

    constructor(address conversionAddr, address flightAddr) public payable {
        require(msg.value > 50 ether, "Put in at least 50 ether as seed fund");
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

        uint8 _status; 
        uint8 processStatus;
        bool ticketSet;
        uint8 ticketType;

        (processStatus, ticketType, _status, ticketSet) = fv.tickets(msg.sender, bookingNumber);
        require(ticketSet, "bookingNumber not found");
        require(processStatus == 2, "Invalid ticket status");
        require(!user.insurances[bookingNumber].set, "You cannot buy multiple insurances for the same booking number");

        // Ideally we should poll for the updated exchange rate here
        uint256 rate = cr.getConversionToSGD();
        assert(rate > 0);
        // Ensure that the company has enough to pay for all cancelled tickets
        // Currently doesnt remove insurances that have expired tho
        uint256 maxTotalPayout = (numInsurances + 1) * CANCELLED_PAYOUT;
        require((maxTotalPayout / rate) <= getBalance(), "Company is broke! Don't buy from us.");

        if (buyWithLoyalty) {
            // Buy with points
            uint256 pointsToDeduct = ROUNDTRIP_PRICE_POINTS;
            if (ticketType == 0) {
                pointsToDeduct = SINGLETRIP_PRICE_POINTS;
            }

            require(user.points >= pointsToDeduct, "Not enough points to buy insurance");
            user.points -= pointsToDeduct;
        } else {
            // Buy normally
            uint256 price = ROUNDTRIP_PRICE_SGD;
            if (ticketType == 0) {
                price = SINGLETRIP_PRICE_SGD;
            }

            // e.g. price is 15000 for $150 per ether
            // If $30, $30/$150 would be 0.2 ether. to avoid floating points,
            // we do 30*(1e18-1e15)/150 = 200 finney == 0.2 ether
            // With this reasoning, we can do 30e18/150 to obtain the same value in wei
            price = price / rate;
            require(msg.value >= price, "Not enough money!");

            // Loyalty reward at the end
            if (ticketType == 0) {
                user.points += SINGLETRIP_REWARD_POINTS;
            } else {
                user.points += ROUNDTRIP_REWARD_POINTS;
            }
        }

        user.insurances[bookingNumber] = Coverage.Insurance({
            claimStatus: 0,
            set: true
        });
        
        numInsurances += 1;
    }

    // We follow this tutorial to ensure safe transfers to avoid re-entrancy and attacks discussed in class.
    // https://consensys.github.io/smart-contract-best-practices/recommendations/#favor-pull-over-push-for-external-calls
    function claimInsurance(bytes8 bookingNumber) public {
        User storage user = users[msg.sender];
        require(user.set, "User is not set");

        uint8 _processStatus;
        uint8 _ticketType;
        bool _set;
        uint8 status; 

        (_processStatus, _ticketType, status, _set) = fv.tickets(msg.sender, bookingNumber);
        Coverage.Insurance storage insurance = user.insurances[bookingNumber];
        require(insurance.set, "Insurance not found.");
        // status = 0 is normal and cannot be claimed
        require(status == 1 || status == 2, "Cannot claim flights that are on schedule.");

        // Ideally we should poll for the updated exchange rate here
        uint256 rate = cr.getConversionToSGD();
        uint256 payout;
        assert(rate > 0);
        if (status == 1 && insurance.claimStatus == 0) {
            // Unclaimed delayed flight, add to claims
            payout = DELAYED_PAYOUT / rate;
            insurance.claimStatus = 1;
        } else if (status == 2) {
            assert(insurance.claimStatus <= 2);
            if (insurance.claimStatus == 0) {
                // Cancelled flight, add to claims
                payout = CANCELLED_PAYOUT / rate;
                insurance.claimStatus = 2;
            } else if (insurance.claimStatus == 1) {
                // Delayed flight became cancelled, add the remaining to claims
                payout = (CANCELLED_PAYOUT - DELAYED_PAYOUT) / rate;
                insurance.claimStatus = 2;
            } else {
                revert("Cancelled flight has been claimed");
            }
        } else {
            revert("Delayed flight has been claimed");
        }

        claims[msg.sender] += payout;
        assert(numInsurances > 0);
        numInsurances -= 1;
    }

    function claimPayouts() external {
        uint payout = claims[msg.sender];
        claims[msg.sender] = 0; // clear the payouts before sending over
        msg.sender.transfer(payout);
    }
}