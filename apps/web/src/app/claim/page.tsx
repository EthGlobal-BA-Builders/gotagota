"use client";

import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useClaimPayroll } from '@/hooks/use-payroll-contract';

interface UnclaimedMonth {
  month: number;
  year: number;
  amount: number;
  payrollId: bigint;
}

export default function ClaimPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });
  const [unclaimedMonths, setUnclaimedMonths] = useState<UnclaimedMonth[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [claimingMonth, setClaimingMonth] = useState<{ month: number; year: number } | null>(null);
  const { claimPayroll, isPending, isSuccess } = useClaimPayroll();

  useEffect(() => {
    if (!isConnected) {
      router.push('/auth');
    }
  }, [isConnected, router]);

  // TODO: Fetch unclaimed months from API/contract
  useEffect(() => {
    if (address) {
      setIsLoading(true);
      // Mock data - in production, fetch from API
      setTimeout(() => {
        setUnclaimedMonths([
          { month: 11, year: 2024, amount: 120.0, payrollId: BigInt(1) },
          { month: 12, year: 2024, amount: 120.0, payrollId: BigInt(1) },
        ]);
        setIsLoading(false);
      }, 1000);
    }
  }, [address]);

  const totalClaimable = unclaimedMonths.reduce((sum, m) => sum + m.amount, 0);

  const handleClaimMonth = async (month: number, year: number, payrollId: bigint) => {
    if (!address) return;

    setClaimingMonth({ month, year });
    try {
      await claimPayroll(payrollId, month, year);
      
      // Remove claimed month from list after successful claim
      if (isSuccess) {
        setUnclaimedMonths(prev => 
          prev.filter(m => !(m.month === month && m.year === year))
        );
      }
    } catch (error) {
      console.error('Error claiming payroll:', error);
      // TODO: Show error message
    } finally {
      setClaimingMonth(null);
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

  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="w-full max-w-2xl mx-auto p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Claim Payroll
          </h1>

          {totalClaimable > 0 ? (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-center text-4xl">
                    {totalClaimable.toFixed(2)} USD
                  </CardTitle>
                  <CardDescription className="text-center">
                    Total available to claim ({unclaimedMonths.length} {unclaimedMonths.length === 1 ? 'month' : 'months'})
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="space-y-4 mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Unclaimed Months</h2>
                {unclaimedMonths.map((unclaimed, index) => {
                  const monthNames = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                  ];
                  const monthName = monthNames[unclaimed.month - 1];
                  const isClaiming = claimingMonth?.month === unclaimed.month && 
                                    claimingMonth?.year === unclaimed.year;

                  return (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-lg">
                              {monthName} {unclaimed.year}
                            </p>
                            <p className="text-gray-600">
                              ${unclaimed.amount.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            onClick={() => handleClaimMonth(unclaimed.month, unclaimed.year, unclaimed.payrollId)}
                            disabled={isPending || isClaiming}
                            className="bg-pink-500 hover:bg-pink-600 text-white"
                          >
                            {isClaiming ? 'Claiming...' : 'Claim'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card className="mb-6">
              <CardContent className="p-8 text-center">
                <p className="text-gray-600 text-lg">
                  No unclaimed payroll available
                </p>
              </CardContent>
            </Card>
          )}

          <div className="text-center text-sm text-gray-600">
            Current Balance: {balance ? parseFloat(balance.formatted).toFixed(2) : '0.00'} {balance?.symbol || 'CELO'}
          </div>
        </div>
      </section>
    </main>
  );
}
