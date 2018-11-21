pragma solidity ^0.4.24;
import "./oraclizeAPI_0.5.sol";

contract CheckValidity is usingOraclize {

  uint256 public results;
  string public callback_result;
  event LogConstructorInitiated(string nextStep);
  event LogPriceUpdated(string price);
  event LogNewOraclizeQuery(string description);

  constructor() public payable {
    emit LogConstructorInitiated("Constructor was initiated. Call 'checkFlightDetails' with the relevant information to send the Oraclize Query.");
  }

  function __callback(bytes32, string result) public {
    if (msg.sender != oraclize_cbAddress()) revert();
    callback_result = result;
    emit LogPriceUpdated(result);
  }

  function checkFlightDetails() public payable {
    results = oraclize_getPrice("URL");
    // if (oraclize_getPrice("computation") > address(this).balance) {
    // emit LogNewOraclizeQuery("Oraclize query was NOT sent, please add some ETH to cover for the query fee");
    // } else {
    // emit LogNewOraclizeQuery("Oraclize query was sent, standing by for the answer..");
      // oraclize_query("computation",
      //   ["",
      //   "POST",
      //   "https://apigw.singaporeair.com/api/v3/flightstatus/getbynumber",
      //   string(abi.encodePacked("{'headers': {'content-type': 'application/json'}",
      //     "{'headers': {'apikey': '",
      //     "apikey",
      //     "'}"))]
      // );
    //}
  }
}