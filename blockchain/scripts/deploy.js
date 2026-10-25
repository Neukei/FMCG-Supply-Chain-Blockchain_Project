const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("=================================================");
  console.log("  FMCG Supply Chain - Deployment Script");
  console.log("=================================================");
  console.log(`Deployer address: ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Deployer balance: ${ethers.formatEther(balance)} ETH`);
  console.log("");

  // Deploy the contract
  console.log("Deploying FMCGSupplyChain...");
  const FMCGSupplyChain = await ethers.getContractFactory("FMCGSupplyChain");
  const contract = await FMCGSupplyChain.deploy(deployer.address);
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log(`✅ FMCGSupplyChain deployed to: ${contractAddress}`);

  // Get deployment transaction details
  const deployTx = contract.deploymentTransaction();
  let receipt = null;
  if (deployTx) {
    console.log(`   Transaction hash: ${deployTx.hash}`);
    receipt = await deployTx.wait();
    console.log(`   Block number:     ${receipt?.blockNumber}`);
    console.log(`   Gas used:         ${receipt?.gasUsed}`);
  }

  // Save deployment info for frontend / backend use
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "hardhat" : network.name;
  const chainId = network.chainId;

  const deploymentInfo = {
    contractName: "FMCGSupplyChain",
    contractAddress,
    deployer: deployer.address,
    network: networkName,
    chainId: chainId.toString(),
    deployedAt: new Date().toISOString(),
    transactionHash: deployTx?.hash,
  };

  // Write deployment info to a JSON file that frontend/backend can read
  const outDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, `${networkName}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log(`\n📄 Deployment info saved to deployments/${networkName}.json`);

  // Copy ABI to shared locations
  const artifactPath = path.join(
    __dirname, "..", "artifacts", "contracts",
    "FMCGSupplyChain.sol", "FMCGSupplyChain.json"
  );
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abiOut = {
      contractAddress,
      abi: artifact.abi,
    };
    fs.writeFileSync(
      path.join(outDir, `FMCGSupplyChain.abi.json`),
      JSON.stringify(abiOut, null, 2)
    );
    console.log(`📄 ABI saved to deployments/FMCGSupplyChain.abi.json`);
  }

  console.log("\n=================================================");
  console.log("  Deployment Complete!");
  console.log("=================================================");
  console.log(`Contract: ${contractAddress}`);
  console.log(`Network:  ${networkName} (Chain ID: ${chainId})`);
  if (chainId.toString() === "11155111") {
    console.log(`Explorer: https://sepolia.etherscan.io/address/${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });
