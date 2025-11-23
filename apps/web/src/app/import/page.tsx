"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { FileUpload } from '@/components/payroll/file-upload';
import { Button } from '@/components/ui/button';
import { usePayroll } from '@/contexts/payroll-context';
import type { PayrollEntryInput } from '@/types/payroll';
import { useChainId } from 'wagmi';

export default function ImportPage() {
  const router = useRouter();
  const { address } = useAccount();
  const chainId = useChainId();
  const { setImportedEntries } = usePayroll();
  const [error, setError] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  if (!address) {
    router.push('/auth');
    return null;
  }

  const handleFileParsed = (entries: PayrollEntryInput[]) => {
    setImportedEntries(entries);
    router.push('/confirm');
  };

  const handleError = (err: string) => {
    setError(err);
  };

  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-2xl mx-auto p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            Import payroll data
          </h1>

          {!showUpload ? (
            <div className="text-center">
              <Button
                onClick={() => setShowUpload(true)}
                className="bg-pink-500 hover:bg-pink-600 text-white py-6 px-12 text-lg"
              >
                Sync payroll
              </Button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <FileUpload
                onFileParsed={handleFileParsed}
                onError={handleError}
                chainId={chainId}
              />
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="mt-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowUpload(false);
                    setError(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

