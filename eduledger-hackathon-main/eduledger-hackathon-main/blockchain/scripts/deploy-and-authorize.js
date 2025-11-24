const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying EduLedger contract and setting up authorization...");
  
  // Get the deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deployer address:", deployer.address);
  
  // Deploy the contract
  console.log("📦 Deploying contract...");
  const EduLedger = await hre.ethers.getContractFactory("EduLedger");
  const eduLedger = await EduLedger.deploy();
  
  console.log("🔄 Waiting for deployment...");
  await eduLedger.waitForDeployment();
  
  const contractAddress = await eduLedger.getAddress();
  console.log("✅ Contract deployed to:", contractAddress);
  
  // Get the owner
  const owner = await eduLedger.owner();
  console.log("👑 Contract owner:", owner);
  
  // Authorize the university address
  const UNIVERSITY_ADDRESS = "0xE87b8ac25186C16c9cDA13ac8Ae0F43B6CD37239";
  console.log("🔑 Authorizing university:", UNIVERSITY_ADDRESS);
  
  try {
    const tx = await eduLedger.addIssuer(UNIVERSITY_ADDRESS);
    console.log("⏳ Authorization transaction sent:", tx.hash);
    
    await tx.wait();
    console.log("✅ University authorized successfully!");
    
    // Verify authorization
    const isAuthorized = await eduLedger.authorizedIssuers(UNIVERSITY_ADDRESS);
    console.log("📋 Authorization verification:", isAuthorized);
    
    console.log("\n🎉 Setup completed successfully!");
    console.log("=================================");
    console.log("📝 Contract Address:", contractAddress);
    console.log("👤 Deployer/Owner:", owner);
    console.log("🏫 University Address:", UNIVERSITY_ADDRESS);
    console.log("✅ University Authorized:", isAuthorized);
    
  } catch (error) {
    console.error("❌ Authorization failed:", error.message);
  }
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});