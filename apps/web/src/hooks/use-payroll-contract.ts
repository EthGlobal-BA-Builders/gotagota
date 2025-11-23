"use client";

import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { PAYROLL_CONTRACT_ABI, getPayrollContractAddress } from '@/lib/contracts';
import { parseUnits } from 'viem';

export function useSetupPayroll() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const setupPayroll = async (
    paymentDay: number,
    months: number,
    employees: `0x${string}`[],
    monthlyAmounts: number[] // monthly amounts in USD (will be converted to wei)
  ) => {
    try {
      const contractAddress = getPayrollContractAddress();
      // Convert amounts from USD to wei (cUSD has 18 decimals)
      const amountsInWei = monthlyAmounts.map((amount) =>
        parseUnits(amount.toString(), 18)
      );

      await writeContract({
        address: contractAddress,
        abi: PAYROLL_CONTRACT_ABI,
        functionName: 'setupPayroll',
        args: [BigInt(paymentDay), BigInt(months), employees, amountsInWei],
      });
    } catch (err) {
      console.error('Error setting up payroll:', err);
      throw err;
    }
  };

  return {
    setupPayroll,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useClaimPayroll() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claimPayroll = async (payrollId: bigint, month: number, year: number) => {
    try {
      const contractAddress = getPayrollContractAddress();
      await writeContract({
        address: contractAddress,
        abi: PAYROLL_CONTRACT_ABI,
        functionName: 'claimPayroll',
        args: [payrollId, BigInt(month), BigInt(year)],
      });
    } catch (err) {
      console.error('Error claiming payroll:', err);
      throw err;
    }
  };

  return {
    claimPayroll,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useCheckBalance(payrollId: bigint | undefined, employeeAddress: `0x${string}` | undefined, month: number | undefined, year: number | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: payrollId && employeeAddress && month && year ? getPayrollContractAddress() : undefined,
    abi: PAYROLL_CONTRACT_ABI,
    functionName: 'checkBalance',
    args: payrollId && employeeAddress && month && year 
      ? [payrollId, employeeAddress, BigInt(month), BigInt(year)]
      : undefined,
  });

  return {
    balance: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useGetUnclaimedMonths(payrollId: bigint | undefined, employeeAddress: `0x${string}` | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: payrollId && employeeAddress ? getPayrollContractAddress() : undefined,
    abi: PAYROLL_CONTRACT_ABI,
    functionName: 'getUnclaimedMonths',
    args: payrollId && employeeAddress ? [payrollId, employeeAddress] : undefined,
  });

  return {
    unclaimedMonths: data as { months: bigint[]; years: bigint[] } | undefined,
    isLoading,
    error,
    refetch,
  };
}

export function useDepositFunds() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const depositFunds = async (payrollId: bigint, amount: number) => {
    try {
      const contractAddress = getPayrollContractAddress();
      const amountInWei = parseUnits(amount.toString(), 18);

      await writeContract({
        address: contractAddress,
        abi: PAYROLL_CONTRACT_ABI,
        functionName: 'depositFunds',
        args: [payrollId, amountInWei],
      });
    } catch (err) {
      console.error('Error depositing funds:', err);
      throw err;
    }
  };

  return {
    depositFunds,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

