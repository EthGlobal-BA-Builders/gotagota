# Regenerative Gas Vault - Smart Contracts

This directory contains the smart contracts for the Regenerative Gas Vault, a liquid staking vault on Celo that uses yield to pay gas for gasless transfers.

## 🏗️ Contract Overview

### RegenerativeGasVault.sol

A CELO vault that enables gasless transfers by using staking yield to subsidize transaction fees.

**Key Features:**
- 💰 Users deposit CELO and maintain 1:1 accounting
- 🌱 CELO is automatically staked in stCELO protocol for yield generation
- ⛽ Yield accumulates in a Gas Fund to pay for transaction costs
- ✍️ Users can send CELO without paying gas (meta-transactions)
- ⚡ Instant withdrawals via liquid staking (no 3-day wait)
- 🔒 Secure meta-transaction signing with nonce protection

**Architecture:**
```
User Deposits CELO → Auto-stake to stCELO → Yield Accrues → Gas Fund → Pays for Gasless Transfers
```

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Compile contracts
pnpm compile

# Run tests
pnpm test

# Deploy to Alfajores testnet
pnpm deploy:alfajores

# Deploy to Celo mainnet
pnpm deploy:celo
```

## 📜 Available Scripts

- `pnpm compile` - Compile smart contracts
- `pnpm test` - Run contract tests
- `pnpm deploy:alfajores` - Deploy to Celo Alfajores testnet
- `pnpm deploy:celo` - Deploy to Celo mainnet
- `pnpm verify:alfajores` - Verify contracts on Alfajores Celoscan
- `pnpm verify:celo` - Verify contracts on Celo Celoscan
- `pnpm clean` - Clean artifacts and cache

## 🌐 Networks

### Celo Mainnet

- **Chain ID**: 42220
- **RPC URL**: https://forno.celo.org
- **Explorer**: https://celoscan.io
- **stCELO Address**: `0xC668583dcbDc9ae6FA3CE46462758188adfdfC24`

### Alfajores Testnet

- **Chain ID**: 44787
- **RPC URL**: https://alfajores-forno.celo-testnet.org
- **Explorer**: https://alfajores.celoscan.io
- **Faucet**: https://faucet.celo.org
- **stCELO Address**: `0x53da9D9d27C02e2acC533DFe99B0e47Cf63DF79F`

## 🔧 Environment Setup

1. Copy the environment template:

   ```bash
   cp .env.example .env
   ```

2. Fill in your configuration:
   ```env
   PRIVATE_KEY=your_private_key_without_0x_prefix
   CELOSCAN_API_KEY=your_celoscan_api_key
   RELAYER_ADDRESS=address_of_your_relayer_account
   ```

## 🚀 Deployment Process

The deployment script will automatically:
1. Detect the network (Alfajores or Celo mainnet)
2. Use the correct stCELO contract address for that network
3. Deploy the RegenerativeGasVault with your relayer address
4. Display deployment details

**Example deployment:**
```bash
# Deploy to Alfajores testnet
pnpm deploy:alfajores

# Deploy to Celo mainnet
pnpm deploy:celo
```

**Verify contracts after deployment:**
```bash
# Verify on Alfajores
pnpm verify:alfajores

# Verify on Celo mainnet
pnpm verify:celo
```

## 📁 Project Structure

```
contracts/
├── RegenerativeGasVault.sol    # Main vault contract with stCELO integration

test/
├── RegenerativeGasVault.ts     # Vault contract tests

ignition/
└── modules/
    └── RegenerativeGasVault.ts # Deployment script

hardhat.config.ts               # Hardhat configuration
tsconfig.json                   # TypeScript configuration
```

## 🔑 Key Contract Functions

### User Functions
- `deposit()` - Deposit CELO into the vault (auto-stakes to stCELO)
- `withdraw(uint256 amount)` - Withdraw CELO (pays own gas)
- `deposits(address user)` - View user's deposit balance

### Gasless Transfer (Meta-Transaction)
- `gaslessTransfer(...)` - Execute a signed transfer without user paying gas
- `getGaslessTransferMessageHash(...)` - Get hash for user to sign

### Relayer Functions
- `subsidizeGas(uint256 amount)` - Relayer claims gas reimbursement from Gas Fund

### Admin Functions
- `setRelayer(address)` - Update relayer address (owner only)

### View Functions
- `totalHoldings()` - Total CELO controlled (liquid + staked)
- `gasFund()` - Current gas fund balance
- `totalDeposits()` - Sum of all user deposits

## 🔄 How It Works

1. **Deposit**: User deposits CELO → Vault stakes it in stCELO
2. **Yield Generation**: stCELO automatically earns staking rewards
3. **Yield Capture**: Difference between holdings and deposits goes to Gas Fund
4. **Gasless Transfer**: 
   - User signs message off-chain (free)
   - Relayer submits transaction on-chain (pays gas)
   - Relayer later recovers gas costs from Gas Fund
5. **Withdrawal**: User can withdraw anytime (instant via stCELO)

## 🔐 Security Notes

- ✅ **Reentrancy Protection**: All state-changing functions use `nonReentrant` modifier
- ✅ **Nonce Protection**: Meta-transactions use incrementing nonces to prevent replay attacks
- ✅ **Signature Verification**: EIP-191 standard signature verification
- ✅ **Access Control**: Owner and relayer role separation
- ⚠️ **Private Key Security**: Never commit `.env` with real private keys
- ⚠️ **Testing**: Always test thoroughly on Alfajores before mainnet deployment
- ⚠️ **Relayer Trust**: Relayer must be trusted as it executes user transactions

## 💡 Development Tips

### Testing Locally
```bash
# Run all tests
pnpm test

# Run tests with gas reporting
REPORT_GAS=true pnpm test

# Run tests with coverage
pnpm coverage
```

### Getting Testnet CELO
1. Visit [Celo Faucet](https://faucet.celo.org)
2. Enter your wallet address
3. Select Alfajores network
4. Receive test CELO tokens

## 📚 Learn More

- [RegenerativeGasVault Architecture](../../ARCHITECTURE.md)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Celo Developer Documentation](https://docs.celo.org)
- [StakedCelo Protocol](https://github.com/celo-org/staked-celo)
- [Viem Documentation](https://viem.sh)
- [Meta-Transactions Guide](https://docs.openzeppelin.com/contracts/4.x/api/metatx)
