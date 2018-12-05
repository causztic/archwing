pragma solidity ^0.4.24;
import "oraclize-api/usingOraclize.sol";
// import "jsmnsol-lib/JsmnSolLib.sol";

contract UserInfo {
    function addTicket(bytes8) public {}
    function updateTicket(bytes8, uint8) public {}
}

contract FlightValidity is usingOraclize {

    event LogNewOraclizeQuery(string description);
    mapping (bytes32 => address) flightMappings;
    UserInfo ui;

    constructor(address uiAddr) public payable {
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
        ui = UserInfo(uiAddr);
    }

    function __callback(bytes32 queryId, string result) public {
        if (msg.sender != oraclize_cbAddress())
            revert("Wrong sender");
        // This can only be called by oraclize when the query 
        // with the queryId completes
        require(flightMappings[queryId] != "", "Invalid queryId");
        bytes8 bookingNum = flightMappings[queryId];
        uint8 processStatus = 1;
        if (result == "null") {
            processStatus = 2;
        }
        ui.updateTicket(bookingNum, processStatus);
        // Delete to prevent double calling
        delete flightMappings[queryId];
    }

    function testCheckFlightDetails() public payable {
        checkFlightDetails("?booking_number=AAAAA&departure=1542868560");
    }

    function checkFlightDetails(
        bytes8 bookingNumber, string queryString) public payable {
        // Assumption: bookingNumber is a unique identifier of ticket
        // This could be extended to actual e-ticket IDs if needed, but we are
        // using booking number only for convenience
        if (oraclize_getPrice("computation") > address(this).balance) {
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
            flightMappings[queryId] = bookingNumber;
            ui.addTicket(bookingNumber);
        }
    }
}