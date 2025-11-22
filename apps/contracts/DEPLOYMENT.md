# RegenerativeGasVault Deployment Guide

This guide walks you through deploying the RegenerativeGasVault contract to Celo networks.

## Prerequisites

1. **Funded Wallet**: You need a wallet with CELO tokens to deploy

   - Alfajores: Get test CELO from [Celo Faucet](https://faucet.celo.org)
   - Mainnet: Ensure you have enough CELO for deployment (~$5-10 worth)

2. **Relayer Wallet**: A separate wallet address that will execute gasless transactions

   - This wallet will need CELO to pay for gas initially
   - It will recover costs from the Gas Fund over time

3. **Environment Setup**: Configure your `.env` file

## Step-by-Step Deployment

### 1. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your values:

```env
# Deployment wallet private key (WITHOUT 0x prefix)
PRIVATE_KEY=your_private_key_here

# Relayer wallet address (WITH 0x prefix)
RELAYER_ADDRESS=0x1234567890123456789012345678901234567890

# Celoscan API key (optional, for verification)
CELOSCAN_API_KEY=your_api_key_here
```

### 2. Compile Contracts

```bash
pnpm compile
```

Expected output:

```
Compiled 1 Solidity file successfully
```

### 3. Deploy to Alfajores Testnet (Recommended First)

```bash
pnpm deploy:alfajores
```

The script will:

- Automatically use stCELO address: `0x53da9D9d27C02e2acC533DFe99B0e47Cf63DF79F`
- Deploy RegenerativeGasVault with your relayer address
- Save deployment artifacts to `ignition/deployments/`

**Example Output:**

```
✅ RegenerativeGasVault deployed to: 0xAbC123...
   Relayer: 0x1234567890123456789012345678901234567890
   stCELO: 0x53da9D9d27C02e2acC533DFe99B0e47Cf63DF79F
```

### 4. Verify Contract (Optional but Recommended)

```bash
pnpm verify:alfajores
```

This makes your contract source code publicly viewable on Celoscan.

### 5. Deploy to Celo Mainnet

**⚠️ Important: Test thoroughly on Alfajores first!**

```bash
pnpm deploy:celo
```

The script will:

- Use mainnet stCELO address: `0xC668583dcbDc9ae6FA3CE46462758188adfdfC24`
- Deploy RegenerativeGasVault to mainnet

### 6. Verify on Mainnet

```bash
pnpm verify:celo
```

## Network-Specific Details

### Alfajores Testnet

| Property       | Value                                        |
| -------------- | -------------------------------------------- |
| Chain ID       | 44787                                        |
| RPC URL        | https://alfajores-forno.celo-testnet.org     |
| Explorer       | https://alfajores.celoscan.io                |
| stCELO Address | `0x53da9D9d27C02e2acC533DFe99B0e47Cf63DF79F` |
| Gas Token      | CELO                                         |

### Celo Mainnet

| Property       | Value                                        |
| -------------- | -------------------------------------------- |
| Chain ID       | 42220                                        |
| RPC URL        | https://forno.celo.org                       |
| Explorer       | https://celoscan.io                          |
| stCELO Address | `0xC668583dcbDc9ae6FA3CE46462758188adfdfC24` |
| Gas Token      | CELO                                         |

## Post-Deployment Steps

### 1. Save Contract Addresses

After deployment, save these addresses for your frontend:

```typescript
// Example: Save to a config file
const config = {
  alfajores: {
    vault: '0xYourDeployedAddress',
    stCELO: '0x53da9D9d27C02e2acC533DFe99B0e47Cf63DF79F',
  },
  celo: {
    vault: '0xYourDeployedAddress',
    stCELO: '0xC668583dcbDc9ae6FA3CE46462758188adfdfC24',
  },
};
```

### 2. Fund the Relayer

The relayer wallet needs CELO to execute transactions:

```bash
# Send CELO to your relayer address
# Alfajores: Get from faucet
# Mainnet: Transfer from your wallet
```

### 3. Test the Deployment

Test basic functions:

```typescript
// Example using ethers.js
const vault = await ethers.getContractAt(
  'RegenerativeGasVault',
  deployedAddress
);

// Check relayer is set correctly
const relayer = await vault.relayer();
console.log('Relayer:', relayer);

// Check stCELO integration
const holdings = await vault.totalHoldings();
console.log('Total Holdings:', holdings.toString());
```

### 4. Initial Deposit (Optional)

Make an initial deposit to test the full flow:

```typescript
// Deposit 1 CELO
await vault.deposit({value: ethers.parseEther('1.0')});

// Check your deposit
const myDeposit = await vault.deposits(myAddress);
console.log('My Deposit:', ethers.formatEther(myDeposit));
```

## Troubleshooting

### "Relayer address not provided"

**Problem**: RELAYER_ADDRESS not set in `.env`

**Solution**:

```env
RELAYER_ADDRESS=0x1234567890123456789012345678901234567890
```

### "Insufficient funds for deployment"

**Problem**: Deployment wallet has no CELO

**Solution**:

- Alfajores: Get test CELO from https://faucet.celo.org
- Mainnet: Transfer CELO to your deployment wallet

### "Network not configured"

**Problem**: Hardhat config doesn't recognize the network

**Solution**: Check `hardhat.config.ts` has the network configured with correct chain ID

### "Cannot find module 'RegenerativeGasVault'"

**Problem**: Contract not compiled

**Solution**:

```bash
pnpm compile
```

## Advanced Configuration

### Custom stCELO Address

If you need to use a different stCELO address:

```bash
hardhat ignition deploy ignition/modules/RegenerativeGasVault.ts \
  --network alfajores \
  --parameters '{"stCeloAddress": "0xYourCustomAddress"}'
```

### Custom Relayer at Deployment Time

```bash
hardhat ignition deploy ignition/modules/RegenerativeGasVault.ts \
  --network alfajores \
  --parameters '{"relayerAddress": "0xYourRelayerAddress"}'
```

## Security Checklist

Before mainnet deployment:

- [ ] Test all functions on Alfajores
- [ ] Verify contract source code on Celoscan
- [ ] Use a hardware wallet or secure key management for mainnet
- [ ] Audit relayer implementation
- [ ] Test gasless transfers end-to-end
- [ ] Ensure relayer wallet is properly secured
- [ ] Set up monitoring for Gas Fund levels
- [ ] Document emergency procedures
- [ ] Test withdrawal flow
- [ ] Verify stCELO integration works correctly

## Support

If you encounter issues:

1. Check the [README](./README.md) for general setup
2. Review [Hardhat documentation](https://hardhat.org/docs)
3. Check [Celo documentation](https://docs.celo.org)
4. Review deployment artifacts in `ignition/deployments/`

## Next Steps

After successful deployment:

1. Integrate contract addresses into your frontend
2. Set up relayer service
3. Implement meta-transaction signing in your app
4. Monitor Gas Fund levels
5. Plan for relayer gas subsidy strategy
