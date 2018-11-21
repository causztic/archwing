pragma solidity ^0.4.24;
import "oraclize-api/usingOraclize.sol";

contract CheckValidity is usingOraclize {

    string public callback_result;
    event LogConstructorInitiated(string nextStep);
    event LogResult(string result);
    event LogNewOraclizeQuery(string description);

    constructor() public payable {}

    function __callback(bytes32, string result) public {
        if (msg.sender != oraclize_cbAddress()) revert("wrong sender");
        callback_result = result;
        emit LogResult(result);
    }

    function testCheckFlightDetails() public payable {
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
        checkFlightDetails("", "SQ", "950", "SIN", "2018-10-24", "CGK", "2018-10-24");
    }

    function checkFlightDetails(
        string apikey, string airlineCode, string flightNumber,
        string originAirportCode, string scheduledDepartureDate,
        string destinationAirportCode, string scheduledArrivalDate) public payable {
        // endpoint is limited to 100 calls a day.
        if (oraclize_getPrice("computation") > address(this).balance) {
            emit LogNewOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
        } else {
            emit LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclize_query("computation",
                ["QmdKK319Veha83h6AYgQqhx9YRsJ9MJE7y33oCXyZ4MqHE",
                "POST",
                "https://apigw.singaporeair.com/api/v3/flightstatus/getbynumber",
                string(abi.encodePacked("{'headers': { 'content-type': 'application/json',",
                    "'apikey':'", apikey,
                    "'},",
                    "'json':",
                    "{'request': {",
                    "'airlineCode':'", airlineCode,
                    "',",
                    "'flightNumber':'", flightNumber,
                    "',",
                    "'originAirportCode':'", originAirportCode,
                    "',",
                    "'scheduledDepartureDate':'", scheduledDepartureDate,
                    "',",
                    "'destinationAirportCode':'", destinationAirportCode,
                    "',",
                    "'scheduledArrivalDate':'", scheduledArrivalDate,
                    "'},",
                    "'clientUUID': 'TestIODocs'}}"))
            ]);
        }
    }
}