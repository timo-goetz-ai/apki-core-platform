export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BASE  = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const TOKEN = process.env.SUPABASE_SERVICE_KEY ?? '';

export async function GET(
  req: NextRequest,
  { params }: { params: { collection: string; field: string } }
) {
  const { collection, field } = params;
  const { searchParams } = req.nextUrl;
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

  if (!BASE || !TOKEN) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const url = new URL(`${BASE}/rest/v1/${collection}`);
    url.searchParams.set('select', field);
    url.searchParams.set('limit', '2000');

    const res = await fetch(url.toString(), {
      headers: { apikey: TOKEN, Authorization: `Bearer ${TOKEN}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Supabase Fehler ${res.status}` }, { status: res.status });
    }

    const rows = (await res.json()) as Record<string, unknown>[];

    // Aggregate by field value in-memory
    const counts = new Map<string, number>();
    for (const row of rows) {
      const raw = row[field];
      const label = raw === null || raw === undefined ? '(leer)' : String(raw).trim() || '(leer)';
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    // Sort by count desc, take top N
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);

    return NextResponse.json({
      labels: sorted.map(([l]) => l),
      values: sorted.map(([, v]) => v),
      meta: { collection, field, limit, generated: new Date().toISOString() },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 500 });
  }
}
