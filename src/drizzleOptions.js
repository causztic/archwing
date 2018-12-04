import CheckValidity from './../build/contracts/CheckValidity.json'
import UserInfo from './../build/contracts/UserInfo.json'
import FlightValidity from './../build/contracts/FlightValidity.json'

const drizzleOptions = {
  web3: {
    block: false,
    fallback: {
      type: 'ws',
      url: 'ws://127.0.0.1:8545'
    }
  },
  contracts: [
    CheckValidity,
    UserInfo,
    FlightValidity
  ],
  polls: {
    accounts: 1500
  }
}

export default drizzleOptions