"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

export default function SuccessPage() {
  const router = useRouter();

  const handleFinish = () => {
    router.push('/metrics');
  };

  return (
    <main className="flex-1">
      <section className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="w-full max-w-md mx-auto p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Success</h1>
          
          <div className="mb-8">
            <CheckCircle2 className="w-24 h-24 mx-auto text-green-500" />
          </div>

          <Button
            onClick={handleFinish}
            className="bg-pink-500 hover:bg-pink-600 text-white py-6 px-12 text-lg w-full"
          >
            Finish
          </Button>
        </div>
      </section>
    </main>
  );
}

