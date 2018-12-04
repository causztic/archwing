pragma solidity ^0.4.24;
import "oraclize-api/usingOraclize.sol";

contract FlightValidity is usingOraclize {

    event LogNewOraclizeQuery(string description);
    mapping (bytes32 => address) flightMappings;

    constructor() public payable {
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
    }

    function __callback(bytes32 queryId, string result) public {
        if (msg.sender != oraclize_cbAddress())
            revert("Wrong sender");
        // this can only be called by oraclize when the query with the queryId completes.
        require(flightMappings[queryId] > 0);
        // delete to prevent double calling
        delete flightMappings[queryId];
    }

    function testCheckFlightDetails() public payable {
        checkFlightDetails("?booking_number=AAAAA");
    }

    // Currently only uses booking number to check details
    // but more will be added once the API is finalized
    function checkFlightDetails(string queryString) public payable {
        if (oraclize_getPrice("computation") > address(this).balance) {
            emit LogNewOraclizeQuery("Oraclize query not sent, not enough ETH");
        } else {
            emit LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclize_query(
                "URL",
                strConcat("https://archwing-bookings.herokuapp.com/tickets", queryString)
            );
        }
    }
}