pragma solidity ^0.4.24;
import "oraclize-api/usingOraclize.sol";
import "jsmnsol-lib/JsmnSolLib.sol";

contract UserInfo {
    function addTicket(bytes8, address) external {}
    function updateTicket(bytes8, uint256, address) external {}
    function claimInsurance(bytes8, address, int) external {}
}

contract FlightValidity is usingOraclize {
    struct UserBooking {
        bytes8 bookingNum;
        address userAddr;
        bool claimInsurance;
        bool set;
    }

    event LogNewOraclizeQuery(string description);
    event LogCallback(bytes8 bookingNumber, uint256 processStatus, string element, uint numTokens);

    mapping (bytes32 => UserBooking) flightMappings;
    UserInfo ui;

    constructor(address uiAddr) public payable {
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
        ui = UserInfo(uiAddr);
    }

    function strCompare(string _a, string _b) pure internal returns (int) {
        bytes memory a = bytes(_a);
        bytes memory b = bytes(_b);
        uint minLength = a.length;
        if (b.length < minLength) minLength = b.length;
        for (uint i = 0; i < minLength; i ++)
            if (a[i] < b[i])
                return - 1;
            else if (a[i] > b[i])
                return 1;
        if (a.length < b.length)
            return - 1;
        else if (a.length > b.length)
            return 1;
        else
            return 0;
    }

    function __callback(bytes32 queryId, string result) public {
        require(msg.sender == oraclize_cbAddress(), "Wrong sender");
        // This can only be called by oraclize when the query
        // with the queryId completes
        require(flightMappings[queryId].set, "Invalid queryId");

        if (strCompare(result, 'false') != 0) {
            // Parse resulting JSON string
            uint returnVal;
            JsmnSolLib.Token[] memory tokens;
            uint numTokens;

            (returnVal, tokens, numTokens) = JsmnSolLib.parse(result, 12);
            assert(returnVal == 0);
            JsmnSolLib.Token memory t = tokens[6];
            string memory arrivalTime = JsmnSolLib.getBytes(result, t.start, t.end);
            t = tokens[10];
            int status = JsmnSolLib.parseInt(JsmnSolLib.getBytes(result, t.start, t.end));

            // ideally we should also check that the ticket beforehand was already delayed / cancelled, to prevent
            // people from purchasing future tickets that have already been cancelled.
            // However, we left that condition check out so that we can use our mock endpoint, which does not have
            // dynamic status capabilities.

            bytes8 bookingNum = flightMappings[queryId].bookingNum;
            address userAddr = flightMappings[queryId].userAddr;
            uint256 processStatus = 1;
            if (block.timestamp < parseInt(arrivalTime)) {
                processStatus = 2;
            }
            ui.updateTicket(bookingNum, processStatus, userAddr);
            emit LogCallback(bookingNum, processStatus, arrivalTime, numTokens);

            if (flightMappings[queryId].claimInsurance) {
                // continue the callback to claim the insurance.
                ui.claimInsurance(bookingNum, userAddr, status);
            }
        }
        // Delete to prevent double calling
        delete flightMappings[queryId];
    }

    function checkFlightDetails(
        bytes8 bookingNumber, string queryString) external payable {
        // Assumption: bookingNumber is a unique identifier of ticket
        // This could be extended to actual e-ticket IDs if needed, but we are
        // using booking number only for convenience

        // over here, the user can potentially craft a different query than the booking number..
        if (oraclize_getPrice("URL") > address(this).balance) {
            emit LogNewOraclizeQuery("Oraclize query not sent, not enough ETH");
        } else {
            emit LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            bytes32 queryId = oraclize_query(
                "URL",
                strConcat(
                    "json(https://archwing-bookings.herokuapp.com/ticket",
                    queryString,
                    ").ticket"
                )
            );
            flightMappings[queryId] = UserBooking({
                bookingNum: bookingNumber,
                userAddr: msg.sender,
                claimInsurance: false,
                set: true
            });
            ui.addTicket(bookingNumber, msg.sender);
        }
    }
    function startClaimInsurance(
        bytes8 bookingNumber, string queryString) external payable {
        // Assumption: bookingNumber is a unique identifier of ticket
        // This could be extended to actual e-ticket IDs if needed, but we are
        // using booking number only for convenience
        if (oraclize_getPrice("URL") > address(this).balance) {
            emit LogNewOraclizeQuery("Oraclize query not sent, not enough ETH");
        } else {
            emit LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            // the current method allows attacker to craft a query string for any cancelled flights
            // which they did not buy insurance for, and be able to cash out. this needs to be fixed.
            bytes32 queryId = oraclize_query(
                "URL",
                strConcat(
                    "json(https://archwing-bookings.herokuapp.com/ticket",
                    queryString,
                    ").ticket"
                )
            );
            flightMappings[queryId] = UserBooking({
                bookingNum: bookingNumber,
                userAddr: msg.sender,
                claimInsurance: true,
                set: true
            });
        }
    }
}