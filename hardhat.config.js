require("dotenv").config();
const path = require("path");

// Ensure Hardhat can store local cache/data without EPERM in restricted or sandbox environments
if (!process.env.LOCALAPPDATA || process.env.LOCALAPPDATA.includes("AppData\\Local")) {
  process.env.LOCALAPPDATA = path.join(__dirname, ".localappdata");
}
if (!process.env.APPDATA || process.env.APPDATA.includes("AppData\\Roaming")) {
  process.env.APPDATA = path.join(__dirname, ".appdata");
}

require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
};
