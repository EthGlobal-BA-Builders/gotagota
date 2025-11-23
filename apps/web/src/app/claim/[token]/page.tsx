"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useClaimPayroll } from '@/hooks/use-payroll-contract';

export default function ClaimTokenPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [payrollData, setPayrollData] = useState<{
    payrollId: bigint;
    month: number;
    year: number;
    amount: number;
  } | null>(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { claimPayroll, isPending, isSuccess } = useClaimPayroll();

  useEffect(() => {
    if (!isConnected) {
      router.push('/auth');
    }
  }, [isConnected, router]);

  // TODO: Decode token to get payrollId, month, year
  // Token format could be: base64(payrollId-month-year) or similar
  useEffect(() => {
    if (token && address) {
      setIsLoading(true);
      // Mock: Decode token to get payroll data
      // In production, this would call an API endpoint that validates the token
      // and returns the payroll information
      try {
        // For now, assume token contains encoded data
        // In production, decode and validate token
        const decoded = atob(token); // Simple base64 decode for demo
        const parts = decoded.split('-');
        
        setTimeout(() => {
          setPayrollData({
            payrollId: BigInt(parts[0] || '1'),
            month: parseInt(parts[1] || '11'),
            year: parseInt(parts[2] || '2024'),
            amount: 120.0, // Would come from contract/API
          });
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Invalid token:', error);
        setIsLoading(false);
      }
    }
  }, [token, address]);

  useEffect(() => {
    if (isSuccess && payrollData) {
      // Redirect or show success message
      router.push('/claim?claimed=true');
    }
  }, [isSuccess, payrollData, router]);

  const handleClaim = async () => {
    if (!address || !payrollData) return;

    setIsClaiming(true);
    try {
      await claimPayroll(payrollData.payrollId, payrollData.month, payrollData.year);
    } catch (error) {
      console.error('Error claiming payroll:', error);
      // TODO: Show error message
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isConnected || !address) {
    return null;
  }

  if (isLoading) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </section>
      </main>
    );
  }

  if (!payrollData) {
    return (
      <main className="flex-1">
        <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="w-full max-w-md mx-auto p-8 text-center">
            <Card>
              <CardContent className="p-8">
                <p className="text-gray-600 text-lg">
                  Invalid or expired claim link
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    );
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[payrollData.month - 1];

  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md mx-auto p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Claim Payroll
          </h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-center text-2xl mb-2">
                {monthName} {payrollData.year}
              </CardTitle>
              <CardTitle className="text-center text-4xl">
                {payrollData.amount.toFixed(2)} USD
              </CardTitle>
              <CardDescription className="text-center">
                Available to claim
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="text-center mb-6">
            <Button
              onClick={handleClaim}
              disabled={isPending || isClaiming}
              className="bg-pink-500 hover:bg-pink-600 text-white py-6 px-12 text-lg w-full"
            >
              {isPending || isClaiming ? 'Claiming...' : 'Claim payroll'}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            Current Balance: {balance ? parseFloat(balance.formatted).toFixed(2) : '0.00'} {balance?.symbol || 'CELO'}
          </div>
        </div>
      </section>
    </main>
  );
}
