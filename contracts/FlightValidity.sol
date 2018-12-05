pragma solidity ^0.4.24;
import "oraclize-api/usingOraclize.sol";
import "jsmnsol-lib/JsmnSolLib.sol";

contract UserInfo {
    function addTicket(bytes8, address) public {}
    function updateTicket(bytes8, uint8, address) public {}
}

contract FlightValidity is usingOraclize {
    struct UserBooking {
        bytes8 bookingNum;
        address userAddr;
        bool set;
    }

    event LogNewOraclizeQuery(string description);
    event LogCallback(string result);
    event LogJsonParse(string element);
    mapping (bytes32 => UserBooking) flightMappings;
    UserInfo ui;

    constructor(address uiAddr) public payable {
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
        ui = UserInfo(uiAddr);
    }

    function __callback(bytes32 queryId, string result) public {
        require(msg.sender == oraclize_cbAddress(), "Wrong sender");
        // This can only be called by oraclize when the query 
        // with the queryId completes
        require(flightMappings[queryId].set, "Invalid queryId");
        emit LogCallback(result);

        // Parse resulting JSON string
        uint returnVal;
        JsmnSolLib.Token[] memory tokens;
        uint numTokens;
        (returnVal, tokens, numTokens) = JsmnSolLib.parse(result, 4);
        JsmnSolLib.Token memory t = tokens[2];
        string memory jsonElement = JsmnSolLib.getBytes(result, t.start, t.end);
        emit LogJsonParse(jsonElement);

        // jsonElement will be 'false' if no ticket is returned
        bytes8 bookingNum = flightMappings[queryId].bookingNum;
        address userAddr = flightMappings[queryId].userAddr;
        uint8 processStatus = 1;
        if (returnVal == 0 && JsmnSolLib.parseBool(jsonElement)) {
            processStatus = 2;
        }
        ui.updateTicket(bookingNum, processStatus, userAddr);
        // Delete to prevent double calling
        delete flightMappings[queryId];
    }

    function checkFlightDetails(
        bytes8 bookingNumber, string queryString) public payable {
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