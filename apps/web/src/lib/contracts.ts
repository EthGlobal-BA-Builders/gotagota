// Contract ABI and address management
// This will be populated after contract deployment

export const PAYROLL_CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'uint256', name: 'paymentDay', type: 'uint256' },
      { internalType: 'uint256', name: 'months', type: 'uint256' },
      { internalType: 'address[]', name: 'employees', type: 'address[]' },
      { internalType: 'uint256[]', name: 'monthlyAmounts', type: 'uint256[]' },
    ],
    name: 'setupPayroll',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'payrollId', type: 'uint256' },
      { internalType: 'uint256', name: 'month', type: 'uint256' },
      { internalType: 'uint256', name: 'year', type: 'uint256' },
    ],
    name: 'claimPayroll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'payrollId', type: 'uint256' },
      { internalType: 'address', name: 'employee', type: 'address' },
      { internalType: 'uint256', name: 'month', type: 'uint256' },
      { internalType: 'uint256', name: 'year', type: 'uint256' },
    ],
    name: 'checkBalance',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'payrollId', type: 'uint256' },
      { internalType: 'uint256', name: 'amount', type: 'uint256' },
    ],
    name: 'depositFunds',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'payrollId', type: 'uint256' },
      { internalType: 'address', name: 'employee', type: 'address' },
    ],
    name: 'getUnclaimedMonths',
    outputs: [
      { internalType: 'uint256[]', name: 'months', type: 'uint256[]' },
      { internalType: 'uint256[]', name: 'years', type: 'uint256[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'payrollId', type: 'uint256' },
      { internalType: 'address', name: 'employee', type: 'address' },
      { internalType: 'uint256', name: 'month', type: 'uint256' },
      { internalType: 'uint256', name: 'year', type: 'uint256' },
    ],
    name: 'hasClaimedMonth',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// Contract address will be set after deployment
// For now, use environment variable or default to empty
export function getPayrollContractAddress(): `0x${string}` {
  // Use process.env directly for client-side access
  const address = process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error('NEXT_PUBLIC_PAYROLL_CONTRACT_ADDRESS not set');
  }
  return address as `0x${string}`;
}

