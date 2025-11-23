// Mock database service
// This file contains mock implementations that call expected API endpoints
// In production, this would be replaced with actual database calls

import type { Payroll, PayrollEntryDB, Employer } from '@/types/payroll';

const API_BASE = '/api/payroll';

export async function createPayroll(
  employerAddress: string,
  paymentDay: number,
  entries: Array<{ address: string; name: string; email: string; amount: number; monthly_weekly: boolean }>
): Promise<Payroll> {
  const response = await fetch(`${API_BASE}/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      employerAddress,
      paymentDay,
      entries,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payroll');
  }

  const data = await response.json();
  return data.payroll;
}

export async function getPayroll(payrollId: string): Promise<Payroll & { entries: PayrollEntryDB[] }> {
  const response = await fetch(`${API_BASE}/${payrollId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch payroll');
  }

  const data = await response.json();
  return data.payroll;
}

export async function updatePayroll(
  payrollId: string,
  updates: Partial<Payroll>
): Promise<Payroll> {
  const response = await fetch(`${API_BASE}/${payrollId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error('Failed to update payroll');
  }

  const data = await response.json();
  return data.payroll;
}

export async function getEmployerPayrolls(employerAddress: string): Promise<Payroll[]> {
  // TODO: Implement API endpoint for this
  return [];
}

export async function getEmployeeClaimablePayrolls(employeeAddress: string): Promise<Array<{
  payrollId: string;
  amount: number;
}>> {
  // TODO: Implement API endpoint for this
  return [];
}

