pragma solidity ^0.4.24;
import "oraclize-api/usingOraclize.sol";
import "jsmnsol-lib/JsmnSolLib.sol";

contract UserInfo {
    function addTicket(bytes8, address) external {}
    function updateTicket(bytes8, uint256, address) external {}
}

contract FlightValidity is usingOraclize {
    struct UserBooking {
        bytes8 bookingNum;
        address userAddr;
        bool set;
    }

    event LogNewOraclizeQuery(string description);
    event LogCallback(bytes8 bookingNumber, uint256 processStatus);

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

        // Parse resulting JSON string
        uint returnVal;
        JsmnSolLib.Token[] memory tokens;
        uint numTokens;

        (returnVal, tokens, numTokens) = JsmnSolLib.parse(result, 10);
        JsmnSolLib.Token memory t = tokens[2];
        string memory jsonElement = JsmnSolLib.getBytes(result, t.start, t.end);

        // jsonElement will be 'false' if no ticket is returned.
        // otherwise it is the timestamp of arrival.

        // ideally we should also check that the ticket beforehand was already delayed / cancelled, to prevent
        // people from purchasing future tickets that have already been cancelled.
        // However, we left that condition check out so that we can use our mock endpoint, which does not have
        // dynamic status capabilities.

        bytes8 bookingNum = flightMappings[queryId].bookingNum;
        address userAddr = flightMappings[queryId].userAddr;
        uint256 processStatus = 1;
        if (strCompare(jsonElement, 'false') != 0 && block.timestamp < parseInt(jsonElement)) {
            processStatus = 2;
        }
        ui.updateTicket(bookingNum, processStatus, userAddr);
        emit LogCallback(bookingNum, processStatus);
        // Delete to prevent double calling
        delete flightMappings[queryId];
    }

    function checkFlightDetails(
        bytes8 bookingNumber, string queryString) external payable {
        // Assumption: bookingNumber is a unique identifier of ticket
        // This could be extended to actual e-ticket IDs if needed, but we are
        // using booking number only for convenience
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
                set: true
            });
            ui.addTicket(bookingNumber, msg.sender);
        }
    }
}