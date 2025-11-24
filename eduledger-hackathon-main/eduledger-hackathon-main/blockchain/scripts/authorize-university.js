const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const UNIVERSITY_ADDRESS = "0xE87b8ac25186C16c9cDA13ac8Ae0F43B6CD37239";

  console.log("🚀 Starting university authorization...");

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  
  
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env file");
    return;
  }
  
  const signer = new ethers.Wallet(privateKey, provider);
  console.log("🔗 Connected as:", signer.address);

  // Contract ABI
  const contractABI = [
    "function authorizedIssuers(address) view returns (bool)",
    "function owner() view returns (address)",
    "function addIssuer(address) external"
  ];

  const eduLedger = new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);

  try {
    // Check if we are the owner
    const owner = await eduLedger.owner();
    console.log("👑 Contract Owner:", owner);
    
    if (signer.address.toLowerCase() !== owner.toLowerCase()) {
      console.log("❌ ERROR: You are not the contract owner!");
      console.log("💡 Please use the owner wallet:", owner);
      return;
    }

    // Check current authorization
    const isCurrentlyAuthorized = await eduLedger.authorizedIssuers(UNIVERSITY_ADDRESS);
    console.log("📊 Current authorization status:", isCurrentlyAuthorized);
    
    if (isCurrentlyAuthorized) {
      console.log("✅ University is already authorized!");
      return;
    }

    // Authorize the university
    console.log("🔑 Authorizing university address...");
    
    const tx = await eduLedger.addIssuer(UNIVERSITY_ADDRESS);
    console.log("⏳ Transaction sent:", tx.hash);
    
    console.log("🔄 Waiting for confirmation...");
    await tx.wait();
    console.log("✅ Transaction confirmed! University authorized.");
    
    // Verify authorization
    const isNowAuthorized = await eduLedger.authorizedIssuers(UNIVERSITY_ADDRESS);
    console.log("📋 New authorization status:", isNowAuthorized);
    
    if (isNowAuthorized) {
      console.log("🎉 University successfully authorized!");
    }
    
  } catch (error) {
    console.error("❌ Authorization failed:", error.message);
  }
}

main().catch(console.error);