const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying EduLedger contract...");
  
  // Deploy the contract
  const EduLedger = await hre.ethers.getContractFactory("EduLedger");
  const eduLedger = await EduLedger.deploy();
  await eduLedger.waitForDeployment();
  
  const contractAddress = await eduLedger.getAddress();
  console.log("✅ EduLedger contract deployed to:", contractAddress);

  // Get the deployer's address
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);

  // Auto-authorize the university address
  const UNIVERSITY_ADDRESS = "0xE87b8ac25186C16c9cDA13ac8Ae0F43B6CD37239";
  console.log("🔑 Authorizing university address:", UNIVERSITY_ADDRESS);
  
  const authorizeUniversityTx = await eduLedger.addIssuer(UNIVERSITY_ADDRESS);
  await authorizeUniversityTx.wait();
  console.log("✅ University authorized successfully!");

  // ALSO authorize the bank address as an issuer so it can access student data
  const BANK_ADDRESS = "0xaF7CA5f4D0283DfFA08658B1A6933D9E0f3E1137";
  console.log("🔑 Authorizing bank address as issuer:", BANK_ADDRESS);
  
  const authorizeBankTx = await eduLedger.addIssuer(BANK_ADDRESS);
  await authorizeBankTx.wait();
  console.log("✅ Bank authorized as issuer successfully!");

  console.log("🎉 Setup completed successfully!");
  console.log("📝 Contract Address:", contractAddress);
  console.log("🏫 University Address:", UNIVERSITY_ADDRESS);
  console.log("🏦 Bank Address:", BANK_ADDRESS);
  console.log("👤 Deployer Address:", deployer.address);
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});