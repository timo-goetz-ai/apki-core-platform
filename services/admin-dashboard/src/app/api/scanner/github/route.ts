export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { runGithubScan } from '@/lib/scanners';

export async function GET() {
  const result = await runGithubScan();
  return NextResponse.json(result, { status: result.error && result.repos.length === 0 ? 503 : 200 });
}
