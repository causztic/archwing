pragma solidity ^0.4.24;

import { Coverage } from "./Coverage.sol";
import { FlightValidity } from "./FlightValidity.sol";
import { ConversionRate } from "./ConversionRate.sol";

contract UserInfo {
    // price in SGD, multiplied by the nomination of wei
    // this way we can do division without floating points as accurately as possible
    uint256 constant ROUNDTRIP_PRICE_SGD = 3000e18;
    uint256 constant SINGLETRIP_PRICE_SGD = 2000e18;
    // price in loyalty points
    uint256 constant ROUNDTRIP_PRICE_POINTS = 150;
    uint256 constant SINGLETRIP_PRICE_POINTS = 100;
    // points reward for purchase
    uint256 constant ROUNDTRIP_REWARD_POINTS = 30;
    uint256 constant SINGLETRIP_REWARD_POINTS = 10;
    // payout for insurance
    uint256 constant DELAYED_PAYOUT = 20000e18;
    uint256 constant CANCELLED_PAYOUT = 500000e18;

    struct User {
        mapping(bytes8 => mapping(uint8 => Coverage.Insurance)) insurances;
        uint256 points;
        bool set;
    }

    ConversionRate private cr;
    FlightValidity private fv;

    mapping(address => User) private users;
    mapping(address => uint256) public claims;
    uint256 numInsurances;

    constructor(address conversionAddr, address flightAddr) public payable {
        require(msg.value > 250 ether, "Put in at least 250 ether as seed fund");
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
        require(!user.set, "User already exists");
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

    // INSURANCES

    function getInsurance(bytes8 bookingNumber, uint8 index) external view returns (bytes8, uint256) {
        require(index < 2, "Insurance index only takes values {0, 1}");

        User storage user = users[msg.sender];
        require(user.set, "User is not set");

        Coverage.Insurance storage insurance = user.insurances[bookingNumber][index];
        require(insurance.set, "Insurance not found.");

        return (bookingNumber, insurance.claimStatus);
    }

    function buyInsurance(bytes8 bookingNumber, bool buyWithLoyalty) external payable {
        User storage user = users[msg.sender];
        require(user.set, "User is not set");

        uint8 status;
        uint8 processStatus;
        bool ticketSet;
        bool isRoundTrip;
        uint256 lastUpdated;

        (processStatus, status, lastUpdated, ticketSet) = fv.ticketStatuses(msg.sender, bookingNumber, 0);
        // We have commented the below require() out because our API is currently static
        // In actual scenario, this would have to be checked in order to buy insurance
        // require(status == 0);

        // We require the user to buy the insurance within 30 minutes of
        // updating the ticket statuses to prevent fraud
        require(block.timestamp < lastUpdated + 1800, "Ticket status is stale");
        require(processStatus == 2, "Invalid ticket status");

        (processStatus, status, lastUpdated, ticketSet) = fv.ticketStatuses(msg.sender, bookingNumber, 1);
        isRoundTrip = ticketSet;
        if (isRoundTrip) {
            require(processStatus == 2, "Invalid ticket status");
            require(
                !user.insurances[bookingNumber][1].set,
                "Cannot buy multiple insurances for the same booking number"
            );
        }

        require(
            !user.insurances[bookingNumber][0].set,
            "Cannot buy multiple insurances for the same booking number"
        );


        // It is the company's responsibility to keep this conversion rate updated
        uint256 rate = cr.getConversionToSGD();
        assert(rate > 0);
        // Ensure that the company has enough to pay for all cancelled tickets
        // there should be a better way, but this for now ensures fairness
        uint256 maxTotalPayout = (numInsurances + 1) * CANCELLED_PAYOUT;
        require((maxTotalPayout / rate) <= getBalance(), "Company is broke! Don't buy from us.");

        if (buyWithLoyalty) {
            // Buy with points
            uint256 pointsToDeduct = SINGLETRIP_PRICE_POINTS;
            if (isRoundTrip) {
                pointsToDeduct = ROUNDTRIP_PRICE_POINTS;
            }

            require(user.points >= pointsToDeduct, "Not enough points to buy insurance");
            user.points -= pointsToDeduct;
        } else {
            // Buy normally
            uint256 price = SINGLETRIP_PRICE_SGD;
            if (isRoundTrip) {
                price = ROUNDTRIP_PRICE_SGD;
            }

            // e.g. price is 15000 for $150 per ether
            // If $30, $30/$150 would be 0.2 ether. to avoid floating points, or 3000/15000
            // we do 3000*(1e18-1e15)/15000 = 200 finney == 0.2 ether
            // With this reasoning, we can do 3000e18/15000 to obtain the same value in wei
            price = price / rate;
            require(msg.value >= price, "Not enough money!");

            // Loyalty reward at the end
            if (isRoundTrip) {
                user.points += ROUNDTRIP_REWARD_POINTS;
            } else {
                user.points += SINGLETRIP_REWARD_POINTS;
            }
        }

        user.insurances[bookingNumber][0] = Coverage.Insurance({
            claimStatus: 0,
            set: true
        });
        numInsurances += 1;

        if (isRoundTrip) {
            user.insurances[bookingNumber][1] = Coverage.Insurance({
                claimStatus: 0,
                set: true
            });
            numInsurances += 1;
        }
    }

    // We follow this tutorial to ensure safe transfers to avoid re-entrancy and attacks discussed in class.
    // https://consensys.github.io/smart-contract-best-practices/recommendations/#favor-pull-over-push-for-external-calls
    function claimInsurance(bytes8 bookingNumber, uint8 index) public {
        // require(index == 0 || index == 1, "Insurance index only takes values {0, 1}"); uneeded check as any invalid index will be caught later

        User storage user = users[msg.sender];
        require(user.set, "User is not set");

        uint8 _processStatus;
        bool _set;
        uint256 _lastUpdated;
        uint8 status;

        (_processStatus, status, _lastUpdated, _set) = fv.ticketStatuses(msg.sender, bookingNumber, index);
        Coverage.Insurance storage insurance = user.insurances[bookingNumber][index];
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

        // this technically is inaccurate because the user can claim a delayed insurance
        //and it turns out to be cancelled.
        // assert(numInsurances > 0);
        // numInsurances -= 1;
    }

    function claimPayouts() external {
        uint payout = claims[msg.sender];
        claims[msg.sender] = 0; // clear the payouts before sending over
        msg.sender.transfer(payout);
    }
}