"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import type { PayrollEntryInput } from '@/types/payroll';

interface PayrollContextType {
  importedEntries: PayrollEntryInput[];
  setImportedEntries: (entries: PayrollEntryInput[]) => void;
  paymentDay: number | null;
  setPaymentDay: (day: number) => void;
  months: number | null;
  setMonths: (months: number) => void;
  reset: () => void;
}

const PayrollContext = createContext<PayrollContextType | undefined>(undefined);

export function PayrollProvider({ children }: { children: ReactNode }) {
  const [importedEntries, setImportedEntries] = useState<PayrollEntryInput[]>([]);
  const [paymentDay, setPaymentDay] = useState<number | null>(null);
  const [months, setMonths] = useState<number | null>(null);

  const reset = () => {
    setImportedEntries([]);
    setPaymentDay(null);
    setMonths(null);
  };

  return (
    <PayrollContext.Provider
      value={{
        importedEntries,
        setImportedEntries,
        paymentDay,
        setPaymentDay,
        months,
        setMonths,
        reset,
      }}
    >
      {children}
    </PayrollContext.Provider>
  );
}

export function usePayroll() {
  const context = useContext(PayrollContext);
  if (context === undefined) {
    throw new Error('usePayroll must be used within a PayrollProvider');
  }
  return context;
}

