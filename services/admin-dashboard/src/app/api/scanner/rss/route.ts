export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { runRssScan } from '@/lib/scanners';

export async function GET() {
  const result = await runRssScan();
  return NextResponse.json(result);
}
