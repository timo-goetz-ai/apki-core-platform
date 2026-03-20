export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { runNocodbSchemaScan } from '@/lib/scanners';

export async function GET() {
  const result = await runNocodbSchemaScan();
  return NextResponse.json(result, { status: result.error && result.tables.length === 0 ? 503 : 200 });
}
