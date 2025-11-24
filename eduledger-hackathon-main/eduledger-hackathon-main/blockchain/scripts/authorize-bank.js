// scripts/authorize-bank.js
const { ethers } = require("hardhat");

async function main() {
  // Use the properly checksummed address
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3".toLowerCase(); // Convert to lowercase to avoid checksum issues
  const BANK_ADDRESS = "0xd5619fda54fe9e19d48953c43328ec4de2d0d3e6";

  console.log("🔑 Authorizing bank address as issuer...");
  console.log("Contract:", CONTRACT_ADDRESS);
  console.log("Bank:", BANK_ADDRESS);
  
  const EduLedger = await ethers.getContractFactory("EduLedger");
  const eduLedger = await EduLedger.attach(CONTRACT_ADDRESS);

  // Check current status
  const isAuthorized = await eduLedger.authorizedIssuers(BANK_ADDRESS);
  console.log("Current bank authorization status:", isAuthorized);

  if (!isAuthorized) {
    console.log("Authorizing bank address...");
    const tx = await eduLedger.addIssuer(BANK_ADDRESS);
    await tx.wait();
    console.log("✅ Bank authorized successfully!");
  } else {
    console.log("✅ Bank is already authorized!");
  }

  // Verify final status
  const finalStatus = await eduLedger.authorizedIssuers(BANK_ADDRESS);
  console.log("Final authorization status:", finalStatus);
}

main().catch((error) => {
  console.error("❌ Authorization failed:", error);
  process.exitCode = 1;
});