"use client";

import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { MetricsCards } from '@/components/payroll/metrics-cards';
import { useEffect } from 'react';

export default function MetricsPage() {
  const router = useRouter();
  const { address } = useAccount();

  useEffect(() => {
    if (!address) {
      router.push('/auth');
    }
  }, [address, router]);

  if (!address) {
    return null;
  }

  // TODO: Fetch actual metrics from API
  const metrics = {
    totalEmployees: 0,
    totalAmount: 0,
    claimed: 0,
    pending: 0,
    paymentDay: null as number | null,
  };

  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="w-full max-w-4xl mx-auto p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Metrics
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <MetricsCards
              totalEmployees={metrics.totalEmployees}
              totalAmount={metrics.totalAmount}
              claimed={metrics.claimed}
              pending={metrics.pending}
              paymentDay={metrics.paymentDay}
            />
          </div>

          <div className="flex flex-col gap-4">
            <Button
              onClick={() => router.push('/import')}
              className="bg-pink-500 hover:bg-pink-600 text-white py-6 text-lg"
            >
              Sync payroll
            </Button>
            
            <Button
              variant="outline"
              onClick={() => router.push('/import')}
              className="py-6 text-lg"
            >
              Edit payroll
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

