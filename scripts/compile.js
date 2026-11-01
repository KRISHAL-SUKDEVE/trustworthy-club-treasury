const fs = require("fs");
const path = require("path");
const solc = require("solc");

const contractPath = path.join(__dirname, "..", "contracts", "ClubTreasury.sol");
const source = fs.readFileSync(contractPath, "utf8");

const input = {
  language: "Solidity",
  sources: {
    "contracts/ClubTreasury.sol": {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["*"],
      },
    },
    optimizer: {
      enabled: true,
      runs: 200,
    },
  },
};

console.log("Compiling ClubTreasury.sol using solc 0.8.20...");
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
  let hasError = false;
  for (const error of output.errors) {
    console.log(error.formattedMessage);
    if (error.severity === "error") {
      hasError = true;
    }
  }
  if (hasError) {
    console.error("Compilation failed.");
    process.exit(1);
  }
}

const contract = output.contracts["contracts/ClubTreasury.sol"]["ClubTreasury"];
const hardhatArtifact = {
  _format: "hh-sol-artifact-1",
  contractName: "ClubTreasury",
  sourceName: "contracts/ClubTreasury.sol",
  abi: contract.abi,
  bytecode: "0x" + contract.evm.bytecode.object,
  deployedBytecode: "0x" + contract.evm.deployedBytecode.object,
  linkReferences: {},
  deployedLinkReferences: {},
};

// Write to Hardhat artifacts folder
const hardhatArtifactDir = path.join(__dirname, "..", "artifacts", "contracts", "ClubTreasury.sol");
if (!fs.existsSync(hardhatArtifactDir)) {
  fs.mkdirSync(hardhatArtifactDir, { recursive: true });
}
fs.writeFileSync(
  path.join(hardhatArtifactDir, "ClubTreasury.json"),
  JSON.stringify(hardhatArtifact, null, 2)
);

// Write to frontend contracts folder
const frontendArtifactDir = path.join(__dirname, "..", "frontend", "src", "contracts");
if (!fs.existsSync(frontendArtifactDir)) {
  fs.mkdirSync(frontendArtifactDir, { recursive: true });
}
fs.writeFileSync(
  path.join(frontendArtifactDir, "ClubTreasury.json"),
  JSON.stringify(
    {
      contractName: "ClubTreasury",
      abi: contract.abi,
      bytecode: "0x" + contract.evm.bytecode.object,
    },
    null,
    2
  )
);

console.log("Compilation successful!");
console.log(`Generated standard Hardhat artifact with ${contract.abi.length} ABI items.`);
