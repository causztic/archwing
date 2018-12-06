module.exports = {
  migrations_directory: "./migrations",
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network i,d
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 500
    }
  }
};
