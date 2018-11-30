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

    function checkFlightDetails(string bookingNumber) {
        if (oraclize_getPrice("URL") > address(this).balance) {
            emit LogNewOraclizeQuery("Oraclize query not sent, not enough ETH");
        } else {
            // TODO: call mock endpoint
            bytes32 queryId =oraclize_query("URL", "json(ENDPOINT_URL_HERE)");
            flightMappings[queryId] = address(this);
        }
    }

    // this method is unused as we are using mock flight data.
    function checkRealFlightDetails(
        string apikey, string airlineCode, string flightNumber,
        string originAirportCode, string scheduledDepartureDate,
        string destinationAirportCode, string scheduledArrivalDate) public payable {
        // endpoint is limited to 100 calls a day.
        if (oraclize_getPrice("computation") > address(this).balance) {
            emit LogNewOraclizeQuery("Oraclize query not sent, not enough ETH");
        } else {
            emit LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclize_query(
                "computation",
                [
                    "QmdKK319Veha83h6AYgQqhx9YRsJ9MJE7y33oCXyZ4MqHE",
                    "POST",
                    "https://apigw.singaporeair.com/api/v3/flightstatus/getbynumber",
                    string(
                        abi.encodePacked(
                            "{'headers': { 'content-type': 'application/json',",
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
                            "'clientUUID': 'TestIODocs'}}"
                        )
                    )
                ]
            );
        }
    }
}