module.exports = {
  migrations_directory: "./migrations",
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*", // Match any network i,d
      gas: 3500000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 500
    }
  }
};
