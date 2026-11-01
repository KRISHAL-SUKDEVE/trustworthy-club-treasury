import contractArtifact from "./ClubTreasury.json";

// Default deployed address or fallback
export const TREASURY_ABI = contractArtifact.abi;

// The deployed contract address can be set via env or fallback
export const DEFAULT_CONTRACT_ADDRESS = 
  import.meta.env.VITE_CONTRACT_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const SUPPORTED_NETWORKS = {
  11155111: "Sepolia Testnet",
  31337: "Hardhat Local",
  1: "Ethereum Mainnet",
  80002: "Polygon Amoy",
};
