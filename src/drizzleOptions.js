import UserInfo from './../build/contracts/UserInfo.json'
import FlightValidity from './../build/contracts/FlightValidity.json'
import ConversionRate from './../build/contracts/ConversionRate.json'

const drizzleOptions = {
  web3: {
    block: false,
    fallback: {
      type: 'ws',
      url: 'ws://127.0.0.1:8545'
    }
  },
  contracts: [
    UserInfo,
    FlightValidity,
    ConversionRate
  ],
  polls: {
    accounts: 1500
  }
}

export default drizzleOptions