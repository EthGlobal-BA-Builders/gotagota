import * as XLSX from 'xlsx';
import type { PayrollEntryInput } from '@/types/payroll';
import { resolveMultipleENS } from './ens-resolver';

/**
 * Parse CSV file content
 */
function parseCSV(content: string): PayrollEntryInput[] {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Expected headers (case-insensitive)
  const expectedHeaders = ['name', 'email', 'address', 'amount', 'monthly_weekly'];
  const headerMap: Record<string, number> = {};
  
  expectedHeaders.forEach(expected => {
    const index = headers.findIndex(h => h === expected || h === expected.replace('_', ' '));
    if (index === -1) {
      throw new Error(`Missing required column: ${expected}`);
    }
    headerMap[expected] = index;
  });

  const entries: PayrollEntryInput[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length < expectedHeaders.length) continue;

    const name = values[headerMap.name] || '';
    const email = values[headerMap.email] || '';
    const addressOrENS = values[headerMap.address] || '';
    const amountStr = values[headerMap.amount] || '0';
    const monthlyWeeklyStr = values[headerMap.monthly_weekly] || 'true';

    if (!name || !email || !addressOrENS) {
      continue; // Skip incomplete rows
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      continue; // Skip invalid amounts
    }

    // Parse monthly_weekly: true for monthly, false for weekly
    const monthly_weekly = monthlyWeeklyStr.toLowerCase() === 'true' || 
                           monthlyWeeklyStr.toLowerCase() === 'monthly' ||
                           monthlyWeeklyStr.toLowerCase() === 'month' ||
                           monthlyWeeklyStr === '1';

    entries.push({
      name,
      email,
      addressOrENS,
      amount,
      monthly_weekly,
    });
  }

  return entries;
}

/**
 * Parse Excel file (XLSX)
 */
function parseExcel(buffer: ArrayBuffer): PayrollEntryInput[] {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  if (!worksheet) {
    throw new Error('Excel file must have at least one sheet');
  }

  // Convert to JSON with header row
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
    header: 1,
    defval: '',
  }) as string[][];

  if (jsonData.length < 2) {
    throw new Error('Excel file must have at least a header row and one data row');
  }

  const headers = (jsonData[0] || []).map(h => String(h).trim().toLowerCase());
  
  // Expected headers (case-insensitive)
  const expectedHeaders = ['name', 'email', 'address', 'amount', 'monthly_weekly'];
  const headerMap: Record<string, number> = {};
  
  expectedHeaders.forEach(expected => {
    const index = headers.findIndex(h => h === expected || h === expected.replace('_', ' '));
    if (index === -1) {
      throw new Error(`Missing required column: ${expected}`);
    }
    headerMap[expected] = index;
  });

  const entries: PayrollEntryInput[] = [];
  
  for (let i = 1; i < jsonData.length; i++) {
    const row = jsonData[i] || [];
    const values = row.map(v => String(v || '').trim());
    
    if (values.length < expectedHeaders.length) continue;

    const name = values[headerMap.name] || '';
    const email = values[headerMap.email] || '';
    const addressOrENS = values[headerMap.address] || '';
    const amountStr = values[headerMap.amount] || '0';
    const monthlyWeeklyStr = values[headerMap.monthly_weekly] || 'true';

    if (!name || !email || !addressOrENS) {
      continue; // Skip incomplete rows
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      continue; // Skip invalid amounts
    }

    // Parse monthly_weekly: true for monthly, false for weekly
    const monthly_weekly = monthlyWeeklyStr.toLowerCase() === 'true' || 
                           monthlyWeeklyStr.toLowerCase() === 'monthly' ||
                           monthlyWeeklyStr.toLowerCase() === 'month' ||
                           monthlyWeeklyStr === '1';

    entries.push({
      name,
      email,
      addressOrENS,
      amount,
      monthly_weekly,
    });
  }

  return entries;
}

/**
 * Parse payroll file (Excel or CSV)
 * Also resolves ENS names to addresses
 */
export async function parsePayrollFile(
  file: File,
  chainId?: number
): Promise<PayrollEntryInput[]> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (fileExtension === 'csv') {
    const text = await file.text();
    const entries = parseCSV(text);
    
    // Resolve ENS names
    const addressesToResolve = entries.map(e => e.addressOrENS);
    const resolved = await resolveMultipleENS(addressesToResolve, chainId);
    
    // Update entries with resolved addresses
    return entries.map(entry => ({
      ...entry,
      addressOrENS: resolved.get(entry.addressOrENS) || entry.addressOrENS,
    }));
  } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    const buffer = await file.arrayBuffer();
    const entries = parseExcel(buffer);
    
    // Resolve ENS names
    const addressesToResolve = entries.map(e => e.addressOrENS);
    const resolved = await resolveMultipleENS(addressesToResolve, chainId);
    
    // Update entries with resolved addresses
    return entries.map(entry => ({
      ...entry,
      addressOrENS: resolved.get(entry.addressOrENS) || entry.addressOrENS,
    }));
  } else {
    throw new Error('Unsupported file format. Please upload a .xlsx, .xls, or .csv file.');
  }
}

