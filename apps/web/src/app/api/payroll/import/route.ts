import { NextRequest, NextResponse } from 'next/server';
import { parsePayrollFile } from '@/lib/file-parser';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const chainIdParam = formData.get('chainId');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const chainId = chainIdParam ? parseInt(chainIdParam as string) : undefined;
    const entries = await parsePayrollFile(file, chainId);

    return NextResponse.json({
      success: true,
      entries,
    });
  } catch (error) {
    console.error('Error importing payroll file:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to import payroll file',
      },
      { status: 500 }
    );
  }
}

