// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// cUSD token addresses:
// Mainnet: 0x765DE816845861e75A25fCA122bb6898B8B1282a
// Alfajores: 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1
// Sepolia: Check Celo docs for testnet address

const PayrollModule = buildModule("PayrollModule", (m) => {
  // For Alfajores testnet
  const cUSDAddress = m.getParameter(
    "cUSDAddress",
    "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1" // Alfajores testnet cUSD
  );

  const payroll = m.contract("Payroll", [cUSDAddress]);

  return { payroll };
});

export default PayrollModule;

