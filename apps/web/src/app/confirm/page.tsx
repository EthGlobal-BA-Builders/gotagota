"use client";

import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { PayrollTable } from '@/components/payroll/payroll-table';
import { usePayroll } from '@/contexts/payroll-context';
import { useEffect } from 'react';

export default function ConfirmPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { importedEntries, setImportedEntries } = usePayroll();

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

  const handleContinue = () => {
    router.push('/setup-payment-day');
  };

  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="w-full max-w-6xl mx-auto p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Confirm payroll data
          </h1>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <PayrollTable
              entries={importedEntries}
              onEntriesChange={setImportedEntries}
            />
          </div>

          <div className="text-center">
            <Button
              onClick={handleContinue}
              className="bg-pink-500 hover:bg-pink-600 text-white py-6 px-12 text-lg"
            >
              Continue
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

