const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("----------------------------------------------------");
  console.log("Deploying Trustworthy Club Treasury Contract...");
  console.log("----------------------------------------------------");

  const [deployer] = await hre.ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${hre.ethers.formatEther(balance)} ETH`);

  // Deployment arguments
  const clubName = "Web3 Builders Club";
  const clubDescription = "Transparent decentralized treasury for events, bounties, and equipment.";
  const membershipFee = hre.ethers.parseEther("0.005"); // 0.005 ETH to join

  // Genesis deposit: dynamically adjust seed funding based on deployer balance for safe testnet deployment
  let seedValue = 0n;
  if (balance >= hre.ethers.parseEther("0.1")) {
    seedValue = hre.ethers.parseEther("0.05");
  } else if (balance >= hre.ethers.parseEther("0.01")) {
    seedValue = hre.ethers.parseEther("0.002");
  } else {
    seedValue = 0n;
  }
  console.log(`Genesis Treasury seed funding: ${hre.ethers.formatEther(seedValue)} ETH`);

  const ClubTreasury = await hre.ethers.getContractFactory("ClubTreasury");
  const treasury = await ClubTreasury.deploy(clubName, clubDescription, membershipFee, {
    value: seedValue,
  });

  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();

  console.log("\n====================================================");
  console.log(`ClubTreasury successfully deployed to: ${treasuryAddress}`);
  console.log(`Network: ${hre.network.name} (Chain ID: ${(await hre.ethers.provider.getNetwork()).chainId})`);
  console.log("====================================================\n");

  // Export contract deployment info and ABI to frontend
  const frontendContractsDir = path.join(__dirname, "..", "frontend", "src", "contracts");
  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const contractArtifact = await hre.artifacts.readArtifact("ClubTreasury");

  const deploymentData = {
    address: treasuryAddress,
    network: hre.network.name,
    chainId: Number((await hre.ethers.provider.getNetwork()).chainId),
    abi: contractArtifact.abi,
    clubName,
    clubDescription,
    membershipFee: membershipFee.toString(),
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, "ClubTreasury.json"),
    JSON.stringify(deploymentData, null, 2)
  );
  console.log(`Contract ABI and metadata written to: frontend/src/contracts/ClubTreasury.json`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
