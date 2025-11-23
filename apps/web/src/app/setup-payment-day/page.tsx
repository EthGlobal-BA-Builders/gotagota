"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { DaySelector } from '@/components/payroll/day-selector';
import { MonthsSelector } from '@/components/payroll/months-selector';
import { usePayroll } from '@/contexts/payroll-context';
import { useEffect } from 'react';

export default function SetupPaymentDayPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { importedEntries, paymentDay, setPaymentDay, months, setMonths } = usePayroll();
  const [selectedDay, setSelectedDay] = useState(paymentDay || 1);
  const [selectedMonths, setSelectedMonths] = useState(months || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!address) {
      router.push('/auth');
      return;
    }
    if (importedEntries.length === 0) {
      router.push('/import');
      return;
    }
  }, [address, importedEntries, router]);

  if (!address || importedEntries.length === 0) {
    return null;
  }

  const handleContinue = async () => {
    setIsSubmitting(true);
    setPaymentDay(selectedDay);
    setMonths(selectedMonths);

    try {
      // Prepare data for API call
      const employees = importedEntries.map(e => e.addressOrENS as `0x${string}`);
      const monthlyAmounts = importedEntries.map(e => e.amount); // These are monthly amounts

      // Call API to create payroll
      const response = await fetch('/api/payroll/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employerAddress: address,
          entries: importedEntries,
          paymentDay: selectedDay,
          months: selectedMonths,
          employees,
          monthlyAmounts,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payroll');
      }

      // Redirect to success page
      router.push('/success');
    } catch (error) {
      console.error('Error setting up payroll:', error);
      // TODO: Show error message to user
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md mx-auto p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Setup payment day
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6 space-y-6">
            <DaySelector value={selectedDay} onChange={setSelectedDay} />
            <MonthsSelector value={selectedMonths} onChange={setSelectedMonths} />
          </div>

          <div className="text-center">
            <Button
              onClick={handleContinue}
              disabled={isSubmitting}
              className="bg-pink-500 hover:bg-pink-600 text-white py-6 px-12 text-lg w-full"
            >
              {isSubmitting ? 'Setting up...' : 'Continue'}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

