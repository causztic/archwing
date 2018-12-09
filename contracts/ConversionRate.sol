pragma solidity ^0.4.24;
import "oraclize-api/usingOraclize.sol";

contract ConversionRate is usingOraclize {

    uint256 public price;
    uint public lastUpdated;

    event LogNewOraclizeQuery(string description);
    event LogCallback(string result, uint lastUpdated);

    constructor() public payable {
        OAR = OraclizeAddrResolverI(0x6f485C8BF6fc43eA212E93BBF8ce046C7f1cb475);
    }

    function __callback(bytes32, string _result) public {
        if (msg.sender != oraclize_cbAddress())
            revert("Wrong sender");

        // this parsing will return 15000 for "150.00" for example
        price = parseInt(_result, 2);
        lastUpdated = block.timestamp;

        emit LogCallback(_result, lastUpdated);
    }

    function getConversionToSGD() external view returns (uint256) {
        return price;
    }

    // Called when the contract is deployed by Truffle
    // Should also be called periodically by the company to update the conversion rate
    function updateConversionToSGD() public payable {
        if (oraclize_getPrice("URL") > address(this).balance) {
            emit LogNewOraclizeQuery("Oraclize query not sent, not enough ETH");
        } else {
            emit LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
            oraclize_query("URL", "json(https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=SGD).SGD");
        }
    }
}