// scripts/debug-bank-dashboard-fixed.js
const { ethers } = require("hardhat");

async function main() {
  // Use lowercase to avoid checksum issues - Hardhat will handle it
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const BANK_ADDRESS = "0xd5619fda54fe9e19d48953c43328ec4de2d0d3e6";
  const STUDENT_ADDRESS = "0xF6b90589c42FF5Bf7a61F67174DE09C45FC32338";

  console.log("🔍 Debugging Bank Dashboard Data Fetching...");
  
  try {
    const EduLedger = await ethers.getContractFactory("EduLedger");
    const eduLedger = await EduLedger.attach(CONTRACT_ADDRESS);

    // Check bank authorization
    const isAuthorized = await eduLedger.authorizedIssuers(BANK_ADDRESS);
    console.log("1. Bank authorized as issuer:", isAuthorized);

    // Check student profile exists
    try {
      const profile = await eduLedger.studentProfiles(STUDENT_ADDRESS);
      console.log("2. Student profile exists:", profile.exists);
      if (profile.exists) {
        console.log("   Student name:", profile.name);
        console.log("   Student email:", profile.contactEmail);
      }
    } catch (error) {
      console.log("2. Error checking profile:", error.message);
    }

    // Test getStudentProfile access
    try {
      console.log("3. Testing getStudentProfile...");
      const studentProfile = await eduLedger.getStudentProfile(STUDENT_ADDRESS);
      console.log("   ✅ SUCCESS - Student profile fetched");
      console.log("   Name:", studentProfile[0]);
      console.log("   Email:", studentProfile[5]);
    } catch (error) {
      console.log("3. ❌ getStudentProfile failed:", error.message);
    }

  } catch (error) {
    console.error("❌ Main error:", error.message);
    
    // Try to check if contract exists at all
    console.log("🔍 Checking if contract exists...");
    try {
      const code = await ethers.provider.getCode(CONTRACT_ADDRESS);
      if (code === "0x") {
        console.log("❌ No contract found at this address!");
      } else {
        console.log("✅ Contract code found, length:", code.length);
      }
    } catch (codeError) {
      console.log("❌ Error checking contract code:", codeError.message);
    }
  }
}

main().catch(console.error);