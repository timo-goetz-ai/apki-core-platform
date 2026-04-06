export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BASE  = (process.env.DIRECTUS_URL ?? '').replace(/\/$/, '');
const TOKEN = process.env.DIRECTUS_TOKEN ?? '';

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { collection: string } }
) {
  const { collection } = params;
  const { searchParams } = req.nextUrl;
  const field = searchParams.get('field') ?? 'date_created';
  const days  = Math.min(Number(searchParams.get('days') ?? '365'), 730);

  if (!BASE || !TOKEN) {
    return NextResponse.json({ error: 'Directus nicht konfiguriert' }, { status: 503 });
  }

  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const url = new URL(`${BASE}/items/${collection}`);
    url.searchParams.set('aggregate[count]', 'id');
    url.searchParams.append('groupBy[]', `year(${field})`);
    url.searchParams.append('groupBy[]', `month(${field})`);
    url.searchParams.append('groupBy[]', `day(${field})`);
    url.searchParams.set(`filter[${field}][_gte]`, since);
    url.searchParams.append('sort[]', field);
    url.searchParams.set('limit', String(days));

    const res = await fetch(url.toString(), {
      headers: authHeaders(),
      signal: AbortSignal.timeout(12000),
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

    // Normalisiere auf { date: 'YYYY-MM-DD', count: number }
    // ECharts Calendar erwartet genau dieses Format
    const data = rows
      .map((row) => {
        const y = String(row[`year(${field})`]  ?? new Date().getFullYear());
        const m = String(row[`month(${field})`] ?? 1).padStart(2, '0');
        const d = String(row[`day(${field})`]   ?? 1).padStart(2, '0');
        return {
          date:  `${y}-${m}-${d}`,
          count: Number((row.count as Record<string, string>)?.id ?? 0),
        };
      })
      .filter((r) => r.count > 0);

    // Berechne Max für die Farbskala
    const max = data.reduce((m, r) => Math.max(m, r.count), 0);

    return NextResponse.json({
      data,
      meta: {
        collection,
        field,
        days,
        max,
        total: data.reduce((s, r) => s + r.count, 0),
        generated: new Date().toISOString(),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
