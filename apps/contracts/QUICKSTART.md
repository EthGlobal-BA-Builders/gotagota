# RegenerativeGasVault - Quick Reference

## 📋 Contract Addresses

### Alfajores Testnet
- **stCELO**: `0x53da9D9d27C02e2acC533DFe99B0e47Cf63DF79F`
- **RegenerativeGasVault**: *Deploy your own*

### Celo Mainnet
- **stCELO**: `0xC668583dcbDc9ae6FA3CE46462758188adfdfC24`
- **RegenerativeGasVault**: *Deploy your own*

## 🚀 Quick Deploy

```bash
# 1. Setup environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY and RELAYER_ADDRESS

# 2. Deploy to testnet
pnpm compile
pnpm deploy:alfajores

# 3. Verify contract
pnpm verify:alfajores
```

## 🔑 Key Functions

### User Actions

```solidity
// Deposit CELO (auto-stakes to stCELO)
function deposit() external payable

// Withdraw CELO (pays own gas)
function withdraw(uint256 amount) external

// Check your balance
function deposits(address user) external view returns (uint256)
```

### Gasless Transfer Flow

```typescript
// 1. User signs message off-chain (FREE)
const messageHash = await vault.getGaslessTransferMessageHash(
  userAddress,
  recipientAddress,
  amount,
  deadline
);
const signature = await wallet.signMessage(messageHash);

// 2. Relayer submits transaction (PAYS GAS)
await vault.gaslessTransfer(
  userAddress,
  recipientAddress,
  amount,
  deadline,
  v, r, s // signature components
);

// 3. Relayer recovers gas costs from Gas Fund
await vault.subsidizeGas(gasCost);
```

### Admin/Relayer Actions

```solidity
// Relayer claims gas reimbursement
function subsidizeGas(uint256 amount) external onlyRelayer

// Owner updates relayer
function setRelayer(address _relayer) external onlyOwner
```

### View Functions

```solidity
// Total CELO controlled (liquid + staked)
function totalHoldings() public view returns (uint256)

// Current gas fund balance
uint256 public gasFund

// Sum of all user deposits
uint256 public totalDeposits
```

## 💡 How Yield Capture Works

```
Total Holdings = Liquid CELO + stCELO Value
Total Deposits = Sum of all user deposits
Gas Fund = Total Holdings - Total Deposits

When yield accrues through stCELO:
Holdings increases → Yield captured → Gas Fund increases
```

## 🔐 Signature Format (EIP-191)

```solidity
struct GaslessTransfer {
  address user;
  address to;
  uint256 amount;
  uint256 nonce;
  uint256 deadline;
  address vault;
}

hash = keccak256(abi.encode(
  keccak256("GaslessTransfer(address user,address to,uint256 amount,uint256 nonce,uint256 deadline,address vault)"),
  user, to, amount, nonce, deadline, vaultAddress
));

digest = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
```

## 📊 Events

```solidity
event Deposited(address indexed user, uint256 amount)
event Withdrawn(address indexed user, uint256 amount)
event GaslessTransfer(address indexed user, address indexed to, uint256 amount, uint256 nonce)
event YieldCaptured(uint256 yieldAmount, uint256 newGasFund)
event GasSubsidized(address indexed relayer, uint256 amount)
event Staked(uint256 celoAmount, uint256 stCeloReceived)
event Unstaked(uint256 stCeloAmount, uint256 celoReceived)
```

## ⚡ Gas Optimization Tips

1. **Lazy Yield Capture**: Yield only updates when `subsidizeGas()` is called
2. **Batch Relayer Claims**: Relayer should claim gas in batches, not per transaction
3. **Smart Unstaking**: Only unstakes when liquid CELO is insufficient

## 🛡️ Security Features

- ✅ Reentrancy protection on all state-changing functions
- ✅ Nonce-based replay protection for meta-transactions
- ✅ EIP-191 signature verification
- ✅ Role-based access control (Owner/Relayer)
- ✅ Immutable stCELO address (set at deployment)

## 🧪 Testing Checklist

- [ ] Deposit CELO
- [ ] Check balance updates correctly
- [ ] Verify CELO is staked to stCELO
- [ ] Sign gasless transfer message
- [ ] Execute gasless transfer via relayer
- [ ] Verify nonce increments
- [ ] Check yield accrues over time
- [ ] Test relayer gas subsidy
- [ ] Withdraw CELO
- [ ] Verify unstaking works correctly

## 📞 Common Integration Patterns

### Frontend Integration

```typescript
import { ethers } from 'ethers';
import VaultABI from './abi/RegenerativeGasVault.json';

const vault = new ethers.Contract(vaultAddress, VaultABI, signer);

// Deposit
await vault.deposit({ value: ethers.parseEther("1.0") });

// Get user balance
const balance = await vault.deposits(userAddress);

// Sign gasless transfer
const hash = await vault.getGaslessTransferMessageHash(
  user, recipient, amount, deadline
);
const signature = await wallet.signMessage(ethers.getBytes(hash));
```

### Relayer Service

```typescript
// Listen for gasless transfer requests
app.post('/gasless-transfer', async (req, res) => {
  const { user, to, amount, deadline, signature } = req.body;
  
  // Verify signature off-chain first
  // Submit transaction
  const tx = await vault.gaslessTransfer(
    user, to, amount, deadline, v, r, s
  );
  
  // Track gas used for later reimbursement
  const receipt = await tx.wait();
  gasCostsToRecover += receipt.gasUsed * receipt.gasPrice;
  
  res.json({ txHash: tx.hash });
});

// Periodic gas recovery
setInterval(async () => {
  if (gasCostsToRecover > threshold) {
    await vault.subsidizeGas(gasCostsToRecover);
    gasCostsToRecover = 0;
  }
}, 3600000); // Every hour
```

## 🔧 Deployment Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `relayerAddress` | Yes | - | Address that executes gasless txs |
| `stCeloAddress` | No | Network-specific | stCELO contract address |

## 📚 Resources

- [Full README](./README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [stCELO Documentation](https://github.com/celo-org/staked-celo)
- [Celo Docs](https://docs.celo.org)
- [Hardhat Ignition](https://hardhat.org/ignition)
