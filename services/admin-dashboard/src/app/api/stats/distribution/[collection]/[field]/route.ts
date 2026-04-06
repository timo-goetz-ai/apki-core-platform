export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BASE  = (process.env.DIRECTUS_URL ?? '').replace(/\/$/, '');
const TOKEN = process.env.DIRECTUS_TOKEN ?? '';

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { collection: string; field: string } }
) {
  const { collection, field } = params;
  const { searchParams } = req.nextUrl;
  const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 100);

  if (!BASE || !TOKEN) {
    return NextResponse.json({ error: 'Directus nicht konfiguriert' }, { status: 503 });
  }

  try {
    const url = new URL(`${BASE}/items/${collection}`);
    url.searchParams.set('aggregate[count]', 'id');
    url.searchParams.append('groupBy[]', field);
    url.searchParams.set('sort[]', `-count`);
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString(), {
      headers: authHeaders(),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Directus Fehler ${res.status}`, detail: text },
        { status: res.status }
      );
    }

    const json = await res.json();
    const rows: Record<string, unknown>[] = json?.data ?? [];

    // Baue Labels + Values Arrays für ECharts
    const labels: string[] = [];
    const values: number[] = [];

    for (const row of rows) {
      const rawLabel = row[field];
      const label = rawLabel === null || rawLabel === undefined
        ? '(leer)'
        : String(rawLabel).trim() || '(leer)';
      const count  = Number((row.count as Record<string, string>)?.id ?? 0);
      labels.push(label);
      values.push(count);
    }

    return NextResponse.json({
      labels,
      values,
      meta: { collection, field, limit, generated: new Date().toISOString() },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
