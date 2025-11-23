"use client";

import { Select } from '@/components/ui/select';

interface DaySelectorProps {
  value: number;
  onChange: (day: number) => void;
}

export function DaySelector({ value, onChange }: DaySelectorProps) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium mb-2">Payment day</label>
      <Select
        value={value.toString()}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full"
      >
        {days.map((day) => (
          <option key={day} value={day}>
            Day {day}
          </option>
        ))}
      </Select>
    </div>
  );
}

