const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const UNIVERSITY_ADDRESS = "0xE87b8ac25186C16c9cDA13ac8Ae0F43B6CD37239";
  const BANK_ADDRESS = "0xaF7CA5f4D0283DfFA08658B1A6933D9E0f3E1137";

  console.log("🔍 Comprehensive authorization check...");
  
  // List of reliable RPC endpoints with fallbacks
  const rpcUrls = [
    process.env.SEPOLIA_RPC_URL, // Your Infura URL
    "https://eth-sepolia.g.alchemy.com/v2/demo", // Alchemy
    "https://1rpc.io/sepolia", // 1RPC
    "https://sepolia.drpc.org" // dRPC
  ];

  let provider;
  let lastError;

  // Try each RPC URL until one works
  for (const rpcUrl of rpcUrls) {
    try {
      console.log(`Trying RPC: ${rpcUrl}`);
      provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Test the connection
      await provider.getBlockNumber();
      console.log("✅ Connected successfully to:", rpcUrl);
      break;
      
    } catch (error) {
      lastError = error;
      console.log(`❌ Failed to connect to: ${rpcUrl}`);
      continue;
    }
  }

  if (!provider) {
    console.error("❌ All RPC endpoints failed. Last error:", lastError.message);
    return;
  }

  // Check if private key is available for transactions
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found in .env file. Cannot authorize addresses.");
    
    // Read-only check with minimal ABI
    const minimalABI = [
      "function authorizedIssuers(address) view returns (bool)",
      "function owner() view returns (address)"
    ];

    const contract = new ethers.Contract(CONTRACT_ADDRESS, minimalABI, provider);
    
    try {
      console.log("\n📋 Read-only authorization status:");
      const universityAuth = await contract.authorizedIssuers(UNIVERSITY_ADDRESS);
      const bankAuth = await contract.authorizedIssuers(BANK_ADDRESS);
      const owner = await contract.owner();
      
      console.log("🏫 University authorization:", universityAuth);
      console.log("🏦 Bank authorization:", bankAuth);
      console.log("👑 Contract owner:", owner);
      
      if (!universityAuth) {
        console.log("\n⚠️  University is NOT authorized. Need to run authorization script.");
      }
      if (!bankAuth) {
        console.log("⚠️  Bank is NOT authorized as issuer. Bank dashboard won't work.");
      }
      
    } catch (error) {
      console.error("❌ Error checking authorization:", error.message);
    }
    return;
  }

  // Full ABI for authorization functions
  const fullABI = [
    "function authorizedIssuers(address) view returns (bool)",
    "function owner() view returns (address)",
    "function addIssuer(address) external"
  ];

  const signer = new ethers.Wallet(privateKey, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, fullABI, signer);

  try {
    console.log("\n🔗 Connected as:", signer.address);
    
    // Check contract owner
    const owner = await contract.owner();
    console.log("👑 Contract owner:", owner);
    
    const isOwner = signer.address.toLowerCase() === owner.toLowerCase();
    console.log("🔐 Connected wallet is owner:", isOwner);
    
    if (!isOwner) {
      console.log("❌ Only contract owner can authorize issuers. Please use owner wallet.");
      console.log("💡 Owner wallet:", owner);
      return;
    }

    // Check current authorization status
    console.log("\n📋 Current authorization status:");
    const universityAuth = await contract.authorizedIssuers(UNIVERSITY_ADDRESS);
    const bankAuth = await contract.authorizedIssuers(BANK_ADDRESS);
    
    console.log("🏫 University authorization:", universityAuth);
    console.log("🏦 Bank authorization:", bankAuth);

    // Authorize university if needed
    if (!universityAuth) {
      console.log("\n🔑 Authorizing university address...");
      try {
        const tx = await contract.addIssuer(UNIVERSITY_ADDRESS);
        console.log("⏳ Transaction sent:", tx.hash);
        await tx.wait();
        console.log("✅ University authorized successfully!");
      } catch (error) {
        console.error("❌ Failed to authorize university:", error.message);
      }
    } else {
      console.log("✅ University is already authorized!");
    }

    // Authorize bank as issuer if needed
    if (!bankAuth) {
      console.log("\n🔑 Authorizing bank address as issuer...");
      try {
        const tx = await contract.addIssuer(BANK_ADDRESS);
        console.log("⏳ Transaction sent:", tx.hash);
        await tx.wait();
        console.log("✅ Bank authorized as issuer successfully!");
      } catch (error) {
        console.error("❌ Failed to authorize bank:", error.message);
      }
    } else {
      console.log("✅ Bank is already authorized as issuer!");
    }

    // Final verification
    console.log("\n✅ Final authorization status:");
    const finalUniAuth = await contract.authorizedIssuers(UNIVERSITY_ADDRESS);
    const finalBankAuth = await contract.authorizedIssuers(BANK_ADDRESS);
    
    console.log("🏫 University authorization:", finalUniAuth);
    console.log("🏦 Bank authorization:", finalBankAuth);

    if (finalUniAuth && finalBankAuth) {
      console.log("\n🎉 All authorizations completed successfully!");
      console.log("💡 Frontend should now work properly for both university and bank.");
    } else {
      console.log("\n⚠️  Some authorizations may still be pending.");
    }

  } catch (error) {
    console.error("❌ Error in authorization process:", error.message);
    
    if (error.message.includes("nonce") || error.message.includes("replacement")) {
      console.log("💡 Try again in a few seconds - transaction nonce issue.");
    }
  }
}

main().catch(console.error);