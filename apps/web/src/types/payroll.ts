export interface PayrollEntry {
  name: string;
  email: string;
  address: string; // Resolved address (not ENS name)
  amount: number;
  monthly_weekly: boolean; // true for monthly, false for weekly
}

export interface PayrollEntryInput {
  name: string;
  email: string;
  addressOrENS: string; // Can be address or ENS name
  amount: number;
  monthly_weekly: boolean;
}

export interface Payroll {
  id: string;
  employer_address: string;
  payment_day: number; // Day of month (1-31)
  months: number; // Number of months the payroll will run
  created_at: Date;
  status: 'draft' | 'active' | 'completed';
}

export interface PayrollEntryDB {
  id: string;
  payroll_id: string;
  employee_address: string;
  name: string;
  email: string;
  amount: number;
  monthly_weekly: boolean;
  claimed: boolean;
  claimed_at: Date | null;
}

export interface MonthlyClaim {
  id: string;
  payroll_entry_id: string;
  month: number; // Month number (1-12)
  year: number; // Year (e.g., 2024)
  claimed: boolean;
  claimed_at: Date | null;
  claim_token: string; // Unique token for claiming via link
}

export interface Employer {
  address: string;
  email: string | null;
  created_at: Date;
}

