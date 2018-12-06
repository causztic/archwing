pragma solidity ^0.4.24;
import "oraclize-api/usingOraclize.sol";
import "jsmnsol-lib/JsmnSolLib.sol";

import { Coverage } from "./Coverage.sol";

contract FlightValidity is usingOraclize {

    struct UserBooking {
        bytes8 bookingNumber;
        address userAddress;
        bool set;
    }

    event LogNewOraclizeQuery(string description);
    event LogFlightStatus(bytes8 bookingNumber, uint256 processStatus, uint256 departureTime);

    mapping (bytes32 => UserBooking) private flightMappings;
    mapping (address => mapping(bytes8 => Coverage.TicketStatus)) public tickets;

    constructor() public payable {
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
    }

    function strCompare(string _a, string _b) internal pure returns (int) {
        bytes memory a = bytes(_a);
        bytes memory b = bytes(_b);
        uint minLength = a.length;
        if (b.length < minLength) minLength = b.length;
        for (uint i = 0; i < minLength; i ++) {
            if (a[i] < b[i])
                return - 1;
            else if (a[i] > b[i])
                return 1;
        }
        if (a.length < b.length)
            return - 1;
        else if (a.length > b.length)
            return 1;
        else
            return 0;
    }

    function bytes8ToString(bytes8 x) internal pure returns (string) {
        bytes memory bytesString = new bytes(8);
        uint charCount = 0;
        for (uint j = 0; j < 8; j++) {
            byte char = byte(bytes8(uint(x) * 2 ** (8 * j)));
            if (char != 0) {
                bytesString[charCount] = char;
                charCount++;
            }
        }
        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (j = 0; j < charCount; j++) {
            bytesStringTrimmed[j] = bytesString[j];
        }
        return string(bytesStringTrimmed);
    }

    function __callback(bytes32 queryId, string result) public {
        require(msg.sender == oraclize_cbAddress(), "Wrong sender");
        // This can only be called by oraclize when the query
        // with the queryId completes
        require(flightMappings[queryId].set, "Invalid queryId");

        bytes8 bookingNumber = flightMappings[queryId].bookingNumber;
        address userAddress = flightMappings[queryId].userAddress;

        uint256 processStatus = 1;
        uint256 departureTime;
        uint256 status;
        if (strCompare(result, "false") != 0) {
            // Parse resulting JSON string
            uint returnVal;
            JsmnSolLib.Token[] memory tokens;
            uint numTokens;

            (returnVal, tokens, numTokens) = JsmnSolLib.parse(result, 11);
            assert(returnVal == 0);
            JsmnSolLib.Token memory t = tokens[10];
            departureTime = parseInt(JsmnSolLib.getBytes(result, t.start, t.end));
            t = tokens[6];
            status = parseInt(JsmnSolLib.getBytes(result, t.start, t.end));

            // Ideally we should also check that the ticket beforehand was already delayed / cancelled, to prevent
            // people from purchasing future tickets that have already been cancelled.
            // However, we left that condition check out so that we can use our mock endpoint, which does not have
            // dynamic status capabilities.

            if (block.timestamp < departureTime) {
                processStatus = 2;
            }
        }

        // ui.updateTicket(bookingNum, processStatus, userAddress);
        tickets[userAddress][bookingNumber].processStatus = uint8(processStatus);
        tickets[userAddress][bookingNumber].flightStatus  = uint8(status);

        emit LogFlightStatus(bookingNumber, processStatus, departureTime);
        // Delete to prevent double calling
        delete flightMappings[queryId];
    }

    function checkFlightDetails(bytes8 bookingNumber) external payable {
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
                    "json(https://archwing-bookings.herokuapp.com/ticket?booking_number=",
                    bytes8ToString(bookingNumber),
                    ").ticket"
                )
            );
            if (!tickets[msg.sender][bookingNumber].set) {
                tickets[msg.sender][bookingNumber] = Coverage.TicketStatus({
                    processStatus: 0,
                    ticketType: 0,
                    flightStatus: 0,
                    set: true
                });
            }

            flightMappings[queryId] = UserBooking({
                bookingNumber: bookingNumber,
                userAddress: msg.sender,
                set: true
            });
        }
    }
}