export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BASE  = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const TOKEN = process.env.SUPABASE_SERVICE_KEY ?? '';

export async function GET(
  req: NextRequest,
  { params }: { params: { collection: string } }
) {
  const { collection } = params;
  const { searchParams } = req.nextUrl;

  const field = (searchParams.get('field') ?? 'created_at').replace('date_created', 'created_at').replace('date_updated', 'updated_at');
  const limit = Math.min(Number(searchParams.get('limit') ?? '60'), 365);

  if (!BASE || !TOKEN) {
    return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 503 });
  }

  try {
    const url = new URL(`${BASE}/rest/v1/${collection}`);
    url.searchParams.set('select', field);
    url.searchParams.set('order', `${field}.asc`);
    url.searchParams.set('limit', '2000');

    const res = await fetch(url.toString(), {
      headers: { apikey: TOKEN, Authorization: `Bearer ${TOKEN}` },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Supabase Fehler ${res.status}` }, { status: res.status });
    }

    const rows = (await res.json()) as Record<string, string | null>[];

    // Aggregate by date in-memory
    const counts = new Map<string, number>();
    for (const row of rows) {
      const val = row[field];
      if (!val) continue;
      const date = val.slice(0, 10); // YYYY-MM-DD
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }

    const data = Array.from(counts.entries())
      .map(([date, count]) => ({ date, count }))
      .slice(-limit);

    return NextResponse.json({
      data,
      meta: { collection, field, limit, points: data.length, generated: new Date().toISOString() },
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 500 });
  }
}
