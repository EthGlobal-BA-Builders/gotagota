// Deployment script for RegenerativeGasVault contract
// Uses Hardhat Ignition for deterministic deployments
// Learn more: https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const RegenerativeGasVaultModule = buildModule(
  "RegenerativeGasVaultModule",
  (m) => {
    // stCELO contract addresses per network
    const STCELO_MAINNET = "0xC668583dcbDc9ae6FA3CE46462758188adfdfC24";
    const STCELO_ALFAJORES = "0x53da9D9d27C02e2acC533DFe99B0e47Cf63DF79F";

    // Get parameters with defaults
    const stCeloAddress = m.getParameter(
      "stCeloAddress",
      STCELO_ALFAJORES // Default to Alfajores
    );
    
    const relayerAddress = m.getParameter(
      "relayerAddress",
      process.env.RELAYER_ADDRESS || "0x0000000000000000000000000000000000000000"
    );

    // Deploy RegenerativeGasVault
    const vault = m.contract("RegenerativeGasVault", [
      relayerAddress,
      stCeloAddress,
    ]);

    return { vault };
  }
);

export default RegenerativeGasVaultModule;
