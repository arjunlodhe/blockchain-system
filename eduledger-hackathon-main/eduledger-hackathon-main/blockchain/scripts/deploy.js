const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Using deployer account:", deployer.address);

  const balance = await deployer.getBalance();
  console.log("💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH");

  console.log("📦 Getting contract factory...");
  const EduLedger = await hre.ethers.getContractFactory("EduLedger");

  console.log("⏳ Deploying EduLedger contract...");
  const eduLedger = await EduLedger.deploy();

  console.log("📡 Deployment transaction sent. Hash:", eduLedger.deploymentTransaction().hash);

  console.log("⏳ Waiting for confirmation...");
  await eduLedger.waitForDeployment();

  const contractAddress = await eduLedger.getAddress();
  console.log("✅ EduLedger contract deployed to:", contractAddress);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
