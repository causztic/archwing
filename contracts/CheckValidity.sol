pragma solidity ^0.4.24;
import "oraclize-api/usingOraclize.sol";

contract CheckValidity is usingOraclize {

    string public callback_result;
    event LogConstructorInitiated(string nextStep);
    event LogResult(string result);
    event LogNewOraclizeQuery(string description);

    constructor() public payable {
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
    }

    function __callback(bytes32, string result) public {
        if (msg.sender != oraclize_cbAddress())
            revert("Wrong sender");
        callback_result = result;
        emit LogResult(result);
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