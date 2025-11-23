"use client";

import { Select } from '@/components/ui/select';

interface MonthsSelectorProps {
  value: number;
  onChange: (months: number) => void;
}

export function MonthsSelector({ value, onChange }: MonthsSelectorProps) {
  const months = Array.from({ length: 60 }, (_, i) => i + 1); // 1 to 60 months

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">Number of months</label>
      <Select
        value={value.toString()}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full"
      >
        {months.map((month) => (
          <option key={month} value={month}>
            {month} {month === 1 ? 'month' : 'months'}
          </option>
        ))}
      </Select>
    </div>
  );
}

