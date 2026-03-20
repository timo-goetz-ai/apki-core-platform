export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { runN8nScan } from '@/lib/scanners';

export async function GET() {
  const result = await runN8nScan();
  return NextResponse.json(result, { status: result.error && result.workflows.length === 0 ? 503 : 200 });
}
