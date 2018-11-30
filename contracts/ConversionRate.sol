pragma solidity ^0.4.24;
import "oraclize-api/usingOraclize.sol";

contract ConversionRate is usingOraclize {

    string public price;
    event LogNewOraclizeQuery(string description);
    event LogCallback(string price);

    constructor() public payable {
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
    }

    function __callback(bytes32, string _result) public {
        if (msg.sender != oraclize_cbAddress())
            revert("Wrong sender");
        price = _result;
        emit LogCallback(price);
    }

    // limitation -> API Key is exposed. We could encrypt the headers instead
    function getConversionToSGD() public payable {
        if (oraclize_getPrice("computation") > address(this).balance) {
            emit LogNewOraclizeQuery("Oraclize query not sent, not enough ETH");
        } else {
            emit LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclize_query(
                "computation",
                ["QmdKK319Veha83h6AYgQqhx9YRsJ9MJE7y33oCXyZ4MqHE",
                "GET",
                "https://sandbox-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=ETH&convert=SGD",
                string(abi.encodePacked(
                        "{'headers': { 'content-type': 'application/json',",
                        "'apikey':'59787f70-c63f-4b11-8ed2-0f8494021e33'}}"))]
            );
        }
    }
}