pragma solidity ^0.4.24;
import "oraclize-api/usingOraclize.sol";

contract ConversionRate is usingOraclize {

    string public price;
    uint public lastUpdated;

    event LogNewOraclizeQuery(string description);
    event LogCallback(string price, uint lastUpdated);

    constructor() public payable {
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
    }

    function __callback(bytes32, string _result) public {
        if (msg.sender != oraclize_cbAddress())
            revert("Wrong sender");

        price = _result;
        lastUpdated = block.timestamp;

        emit LogCallback(price, lastUpdated);
    }

    // limitation -> API Key is exposed. We could encrypt the headers instead
    function getConversionToSGD() public payable {
        if (oraclize_getPrice("URL") > address(this).balance) {
            emit LogNewOraclizeQuery("Oraclize query not sent, not enough ETH");
        } else {
            emit LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclize_query("URL", "json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=SGD)");
        }
    }
}