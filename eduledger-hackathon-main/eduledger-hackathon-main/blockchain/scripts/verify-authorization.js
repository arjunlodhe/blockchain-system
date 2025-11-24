const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  // Replace with your actual contract address
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const UNIVERSITY_ADDRESS = "0xE87b8ac25186C16c9cDA13ac8Ae0F43B6CD37239";

  console.log("🔍 Verifying authorization status...");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("University:", UNIVERSITY_ADDRESS);

  // Use standard Ethers provider instead of Hardhat provider
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  
  // Get the contract ABI (you can copy this from your frontend or artifacts)
  const contractABI = [
    "function authorizedIssuers(address) view returns (bool)",
    "function owner() view returns (address)",
    "function addIssuer(address) external"
  ];

  // Create contract instance
  const eduLedger = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
  
  try {
    // Check authorization
    const isAuthorized = await eduLedger.authorizedIssuers(UNIVERSITY_ADDRESS);
    console.log("📋 University Authorization Status:", isAuthorized);
    
    // Check contract owner
    const owner = await eduLedger.owner();
    console.log("👑 Contract Owner:", owner);
    
    if (isAuthorized) {
      console.log("✅ UNIVERSITY IS AUTHORIZED - Frontend should work!");
      console.log("💡 If frontend still shows 'Access Denied', check:");
      console.log("   1. Contract address in frontend config");
      console.log("   2. ABI is up to date");
      console.log("   3. Browser cache cleared");
    } else {
      console.log("❌ UNIVERSITY IS NOT AUTHORIZED");
      console.log("💡 Run authorization script to fix this");
    }
  } catch (error) {
    console.error("❌ Error checking authorization:", error.message);
  }
}

main().catch(console.error);