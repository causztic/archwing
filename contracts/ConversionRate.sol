pragma solidity ^0.4.24;
import "oraclize-api/usingOraclize.sol";

contract ConversionRate is usingOraclize {

    uint256 public price;
    uint public lastUpdated;

    event LogNewOraclizeQuery(string description);
    event LogCallback(string result, uint lastUpdated);

    constructor() public payable {
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
        updateConversionToSGD();
    }

    function __callback(bytes32, string _result) public {
        if (msg.sender != oraclize_cbAddress())
            revert("Wrong sender");

        // this code will break if 1 ether ever drops below $100 or rises above $1000.
        // however, we get to save some gas!
        price = parseInt(_result, 3);
        lastUpdated = block.timestamp;

        emit LogCallback(_result, lastUpdated);
    }

    function getConversionToSGD() external view returns (uint256) {
        return price;
    }

    function updateConversionToSGD() public payable {
        if (oraclize_getPrice("URL") > address(this).balance) {
            emit LogNewOraclizeQuery("Oraclize query not sent, not enough ETH");
        } else {
            emit LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclize_query("URL", "json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=SGD).SGD");
        }
    }
}