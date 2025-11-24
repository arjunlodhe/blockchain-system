const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const BANK_ADDRESS = "0xaF7CA5f4D0283DfFA08658B1A6933D9E0f3E1137";
  const STUDENT_ADDRESS = "0xF6b90589c42FF5Bf7a61F67174DE09C45FC32338";

  console.log("🔍 Debugging Bank Access Issues...");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Bank:", BANK_ADDRESS);
  console.log("Student:", STUDENT_ADDRESS);

  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    console.error("❌ PRIVATE_KEY not found. Using read-only mode.");
  }

  const signer = privateKey ? new ethers.Wallet(privateKey, provider) : provider;
  console.log("🔗 Connected as:", signer.address);

  // Comprehensive ABI for debugging
  const debugABI = [
    // Authorization checks
    "function authorizedIssuers(address) view returns (bool)",
    "function owner() view returns (address)",
    
    // Profile existence checks
    "function studentProfiles(address) view returns ((string, uint256, string, string, string, string, string, string, address, bool))",
    
    // Function access checks
    "function getStudentProfile(address) view returns (string, uint256, string, string, string, string, string, string, address)",
    "function getMyProfile() view returns (string, uint256, string, string, string, string, string, string, address)",
    
    // Bank-specific functions (if they exist)
    "function getStudentProfileForBank(address) view returns (string, string, string, string, address)",
    
    // Utility functions
    "function getCredentialCount(address) view returns (uint256)",
    "function getMyCredentialCount() view returns (uint256)"
  ];

  const contract = new ethers.Contract(CONTRACT_ADDRESS, debugABI, signer);

  try {
    console.log("\n1. 🏦 Checking Bank Authorization...");
    const isBankAuthorized = await contract.authorizedIssuers(BANK_ADDRESS);
    console.log("   Bank is authorized as issuer:", isBankAuthorized);

    console.log("\n2. 👑 Checking Contract Ownership...");
    const owner = await contract.owner();
    console.log("   Contract owner:", owner);
    console.log("   Connected wallet is owner:", signer.address.toLowerCase() === owner.toLowerCase());

    console.log("\n3. 👤 Checking Student Profile Existence...");
    try {
      const profile = await contract.studentProfiles(STUDENT_ADDRESS);
      console.log("   Profile exists:", profile.exists);
      console.log("   Student name:", profile.name);
      console.log("   Wallet address:", profile.walletAddress);
    } catch (profileError) {
      console.log("   ❌ Error checking profile:", profileError.message);
    }

    console.log("\n4. 🔄 Testing Function Access...");
    
    // Test getStudentProfile (bank/issuer only)
    try {
      console.log("   Testing getStudentProfile...");
      const studentProfile = await contract.getStudentProfile(STUDENT_ADDRESS);
      console.log("   ✅ getStudentProfile SUCCESS - Bank has access!");
      console.log("   Student name:", studentProfile[0]);
    } catch (error1) {
      console.log("   ❌ getStudentProfile FAILED:", error1.message);
    }

    // Test getMyProfile (student only - should fail for bank)
    try {
      console.log("   Testing getMyProfile as bank...");
      const myProfile = await contract.getMyProfile();
      console.log("   ✅ getMyProfile SUCCESS (unexpected for bank)");
    } catch (error2) {
      console.log("   ❌ getMyProfile FAILED (expected for bank):", error2.message);
    }

    // Test getStudentProfileForBank (if it exists)
    try {
      console.log("   Testing getStudentProfileForBank...");
      const bankProfile = await contract.getStudentProfileForBank(STUDENT_ADDRESS);
      console.log("   ✅ getStudentProfileForBank SUCCESS");
      console.log("   Student name:", bankProfile[0]);
    } catch (error3) {
      console.log("   ❌ getStudentProfileForBank FAILED or doesn't exist:", error3.message);
    }

    console.log("\n5. 📊 Checking Credentials...");
    try {
      const credCount = await contract.getCredentialCount(STUDENT_ADDRESS);
      console.log("   Number of credentials:", Number(credCount));
    } catch (credError) {
      console.log("   ❌ Error checking credentials:", credError.message);
    }

    console.log("\n6. 💡 Recommendations:");
    if (!isBankAuthorized) {
      console.log("   ❌ BANK IS NOT AUTHORIZED AS ISSUER!");
      console.log("   💡 Run: npx hardhat run scripts/auth-bank.js --network sepolia");
    } else {
      console.log("   ✅ Bank is properly authorized as issuer");
    }

    console.log("\n7. 🛠️  Quick Fix Options:");
    console.log("   a) Use getStudentProfile() instead of bank-specific functions");
    console.log("   b) Ensure bank wallet is connected in frontend");
    console.log("   c) Verify contract address is correct");
    console.log("   d) Check if student profile truly exists");

  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

main().catch(console.error);