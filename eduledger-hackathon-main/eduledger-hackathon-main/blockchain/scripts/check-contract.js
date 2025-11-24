// scripts/check-contract.js
const { ethers } = require("hardhat");

async function main() {
  const addresses = [
    "0x5FbDB2315678afecb367f032d93F642f64180aa3", // original
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"  // lowercase
  ];

  for (const address of addresses) {
    try {
      console.log(`Checking contract at: ${address}`);
      const code = await ethers.provider.getCode(address);
      
      if (code === "0x") {
        console.log("❌ No contract at this address");
      } else {
        console.log("✅ Contract found! Code length:", code.length);
        
        // Try to instantiate contract
        const EduLedger = await ethers.getContractFactory("EduLedger");
        const contract = EduLedger.attach(address);
        
        // Try a simple call
        const owner = await contract.owner();
        console.log("✅ Contract owner:", owner);
        break;
      }
    } catch (error) {
      console.log("❌ Error:", error.message);
    }
  }
}

main().catch(console.error);