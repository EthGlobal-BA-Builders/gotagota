"use client";

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import type { PayrollEntryInput } from '@/types/payroll';

interface PayrollTableProps {
  entries: PayrollEntryInput[];
  onEntriesChange: (entries: PayrollEntryInput[]) => void;
}

export function PayrollTable({ entries, onEntriesChange }: PayrollTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editData, setEditData] = useState<PayrollEntryInput | null>(null);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditData({ ...entries[index] });
  };

  const handleSave = () => {
    if (editingIndex === null || !editData) return;
    
    const updated = [...entries];
    updated[editingIndex] = editData;
    onEntriesChange(updated);
    setEditingIndex(null);
    setEditData(null);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setEditData(null);
  };

  const handleDelete = (index: number) => {
    const updated = entries.filter((_, i) => i !== index);
    onEntriesChange(updated);
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    if (address.length > 10) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    return address;
  };

  return (
    <div className="w-full overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Frequency</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500">
                No entries found
              </TableCell>
            </TableRow>
          ) : (
            entries.map((entry, index) => (
              <TableRow key={index}>
                {editingIndex === index ? (
                  <>
                    <TableCell>
                      <Input
                        value={editData?.name || ''}
                        onChange={(e) =>
                          setEditData({ ...editData!, name: e.target.value })
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="email"
                        value={editData?.email || ''}
                        onChange={(e) =>
                          setEditData({ ...editData!, email: e.target.value })
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={editData?.addressOrENS || ''}
                        onChange={(e) =>
                          setEditData({
                            ...editData!,
                            addressOrENS: e.target.value,
                          })
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={editData?.amount || 0}
                        onChange={(e) =>
                          setEditData({
                            ...editData!,
                            amount: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <select
                        value={editData?.monthly_weekly ? 'true' : 'false'}
                        onChange={(e) =>
                          setEditData({
                            ...editData!,
                            monthly_weekly: e.target.value === 'true',
                          })
                        }
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="true">Monthly</option>
                        <option value="false">Weekly</option>
                      </select>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleSave}
                          className="h-8 w-8 p-0"
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancel}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{entry.name}</TableCell>
                    <TableCell>{entry.email}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {formatAddress(entry.addressOrENS)}
                    </TableCell>
                    <TableCell>${entry.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      {entry.monthly_weekly ? 'Monthly' : 'Weekly'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

