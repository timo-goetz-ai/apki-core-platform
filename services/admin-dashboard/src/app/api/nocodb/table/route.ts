export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { unauthorizedResponse, verifyApiKey } from '@/lib/auth';

const BASE = (process.env.NOCODB_URL ?? 'https://nocodb.automation-plus-ki.de').replace(/\/$/, '');
const TOKEN = process.env.NOCODB_API_TOKEN ?? '';
const PROJECT = process.env.NOCODB_AI_SYSTEM_BASE_ID ?? 'pfx0ca6docorj8n';

/**
 * Generic server-side NocoDB table proxy.
 * GET /api/nocodb/table?id=<tableId>&limit=100
 * Keeps the NocoDB token server-side — never exposed to the browser.
 */
export async function GET(req: NextRequest) {
  if (!verifyApiKey(req)) return unauthorizedResponse();

  if (!TOKEN) {
    return NextResponse.json({ error: 'NOCODB_API_TOKEN ist nicht konfiguriert' }, { status: 503 });
  }

  const tableId = req.nextUrl.searchParams.get('id');
  if (!tableId) return NextResponse.json({ error: 'Missing ?id=' }, { status: 400 });

  const limit = req.nextUrl.searchParams.get('limit') ?? '100';

  const res = await fetch(
    `${BASE}/api/v1/db/data/noco/${PROJECT}/${tableId}?limit=${limit}`,
    { headers: { 'xc-token': TOKEN }, signal: AbortSignal.timeout(10000) }
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.ok ? 200 : res.status });
}
