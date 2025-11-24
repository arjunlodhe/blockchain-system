const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting comprehensive EduLedger deployment process...\n");

  // Configuration
  const UNIVERSITY_ADDRESS = "0xE87b8ac25186C16c9cDA13ac8Ae0F43B6CD37239";
  const BANK_ADDRESS = "0xD5619fdA54Fe9E19D48953c43328eC4dE2D0D3E6";
  const ADMIN_ADDRESS = "0x61b9fbF168e3447BE375Cd24E321bf8eFA42BD68";

  // ===== PHASE 1: DEPLOYMENT =====
  console.log("1. 📦 DEPLOYING CONTRACT...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("   👤 Deployer address:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("   💰 Deployer balance:", hre.ethers.formatEther(balance), "ETH");

  const EduLedger = await hre.ethers.getContractFactory("EduLedger");
  const eduLedger = await EduLedger.deploy();
  
  console.log("   ⏳ Waiting for deployment confirmation...");
  await eduLedger.waitForDeployment();
  
  const contractAddress = await eduLedger.getAddress();
  console.log("   ✅ Contract deployed to:", contractAddress);

  // Save to environment
  process.env.CONTRACT_ADDRESS = contractAddress;
  console.log("   💾 Contract address saved to process environment\n");

  // ===== PHASE 2: SETUP & AUTHORIZATION =====
  console.log("2. 🔧 SETTING UP AUTHORIZATIONS...");

  // Check if we're the owner
  const owner = await eduLedger.owner();
  if (deployer.address.toLowerCase() !== owner.toLowerCase()) {
    console.log("   ❌ Deployer is not contract owner. Setup aborted.");
    return;
  }
  console.log("   👑 Confirmed as contract owner");

  // Setup initial authorizations
  const setupInitialAuthorizations = async () => {
    console.log("   🏗️ Setting up initial authorizations...");
    try {
      const adminStatus = await eduLedger.isAdmin(deployer.address);
      if (!adminStatus) {
        console.log("   🔑 Adding deployer as admin...");
        const adminTx = await eduLedger.addAdmin(deployer.address);
        await adminTx.wait();
        console.log("   ✅ Deployer added as admin successfully");
      } else {
        console.log("   ✅ Deployer already admin");
      }
    } catch (error) {
      console.log("   ⚠️ Could not add deployer as admin:", error.message);
    }
    // Authorize the predefined university address
    try {
      const uniAuth = await eduLedger.authorizedUniversities(UNIVERSITY_ADDRESS);
      if (!uniAuth) {
        console.log("   🔑 Authorizing university address...");
        const uniTx = await eduLedger.addUniversity(UNIVERSITY_ADDRESS);
        await uniTx.wait();
        console.log("   ✅ University authorized successfully");
      } else {
        console.log("   ✅ University already authorized");
      }
    } catch (error) {
      console.log("   ⚠️ Could not authorize university:", error.message);
    }
    
    // Authorize the predefined bank address
    try {
      const bankAuth = await eduLedger.authorizedBanks(BANK_ADDRESS);
      if (!bankAuth) {
        console.log("   🔑 Authorizing bank address...");
        const bankTx = await eduLedger.addBank(BANK_ADDRESS);
        await bankTx.wait();
        console.log("   ✅ Bank authorized successfully");
      } else {
        console.log("   ✅ Bank already authorized");
      }
    } catch (error) {
      console.log("   ⚠️ Could not authorize bank:", error.message);
    }
    
    // Add the predefined admin address as admin
    try {
      const adminStatus = await eduLedger.isAdmin(ADMIN_ADDRESS);
      if (!adminStatus) {
        console.log("   🔑 Adding admin address...");
        const adminTx = await eduLedger.addAdmin(ADMIN_ADDRESS);
        await adminTx.wait();
        console.log("   ✅ Admin added successfully");
      } else {
        console.log("   ✅ Admin already exists");
      }
    } catch (error) {
      console.log("   ⚠️ Could not add admin:", error.message);
    }
  };

  await setupInitialAuthorizations();

  // ===== PHASE 3: VERIFICATION =====
  console.log("\n3. 🔍 VERIFYING DEPLOYMENT...");

  // Verify contract details
  console.log("   📋 Contract Details:");
  console.log("   - Address:", contractAddress);
  console.log("   - Owner:", await eduLedger.owner());

  // Verify authorizations
  console.log("   📋 Authorization Status:");
  console.log("   - University:", await eduLedger.authorizedUniversities(UNIVERSITY_ADDRESS));
  console.log("   - Bank:", await eduLedger.authorizedBanks(BANK_ADDRESS));
  console.log("   - Admin:", await eduLedger.isAdmin(ADMIN_ADDRESS));

  // Verify contract code exists
  try {
    const code = await hre.ethers.provider.getCode(contractAddress);
    console.log("   📦 Contract code deployed:", code !== "0x" ? "✅ YES" : "❌ NO");
  } catch (error) {
    console.log("   ❌ Error verifying contract code:", error.message);
  }

  // ===== PHASE 4: SUMMARY =====
  console.log("\n4. 🎉 DEPLOYMENT SUMMARY");
  console.log("   ===================================");
  console.log("   📝 Contract Address:", contractAddress);
  console.log("   👤 Deployer/Owner:", deployer.address);
  console.log("   🏫 University Address:", UNIVERSITY_ADDRESS);
  console.log("   🏦 Bank Address:", BANK_ADDRESS);
  console.log("   👑 Admin Address:", ADMIN_ADDRESS);
  console.log("   ✅ University Authorized:", await eduLedger.authorizedUniversities(UNIVERSITY_ADDRESS));
  console.log("   ✅ Bank Authorized:", await eduLedger.authorizedBanks(BANK_ADDRESS));
  console.log("   ✅ Admin Authorized:", await eduLedger.isAdmin(ADMIN_ADDRESS));
  console.log("   ===================================");

  console.log("\n💡 Next steps:");
  console.log("   - Update frontend with contract address:", contractAddress);
  console.log("   - Test with the predefined wallet addresses");
  console.log("   - The system is ready to use!");
}

// Error handling
main().catch((error) => {
  console.error("\n❌ DEPLOYMENT FAILED:");

  if (error.message.includes("nonce")) {
    console.log("💡 Try again in 30 seconds - transaction nonce issue");
  } else if (error.message.includes("insufficient funds")) {
    console.log("💡 Add more ETH to your deployer wallet");
  } else if (error.message.includes("revert")) {
    console.log("💡 Contract might already be deployed or authorization issue");
  } else {
    console.log("Error details:", error.message);
  }
  
  process.exitCode = 1;
});