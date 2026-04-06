export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const BASE  = (process.env.DIRECTUS_URL ?? '').replace(/\/$/, '');
const TOKEN = process.env.DIRECTUS_TOKEN ?? '';

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
}

interface DirectusAggRow {
  count: { id: string };
  year:  { date_created?: string };
  month: { date_created?: string };
  day:   { date_created?: string };
}

export async function GET(
  req: NextRequest,
  { params }: { params: { collection: string } }
) {
  const { collection } = params;
  const { searchParams } = req.nextUrl;

  const field = searchParams.get('field') ?? 'date_created';
  const limit = Math.min(Number(searchParams.get('limit') ?? '60'), 365);

  if (!BASE || !TOKEN) {
    return NextResponse.json({ error: 'Directus nicht konfiguriert' }, { status: 503 });
  }

  try {
    const url = new URL(`${BASE}/items/${collection}`);
    url.searchParams.set('aggregate[count]', 'id');
    url.searchParams.append('groupBy[]', `year(${field})`);
    url.searchParams.append('groupBy[]', `month(${field})`);
    url.searchParams.append('groupBy[]', `day(${field})`);
    url.searchParams.append('sort[]', field);
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
    const rows: DirectusAggRow[] = json?.data ?? [];

    // Normalisiere auf { date: 'YYYY-MM-DD', count: number }
    const data = rows
      .map((row) => {
        const y = row[`year(${field})` as keyof typeof row] as string | undefined
                ?? String(new Date().getFullYear());
        const m = String(row[`month(${field})` as keyof typeof row] ?? 1).padStart(2, '0');
        const d = String(row[`day(${field})`   as keyof typeof row] ?? 1).padStart(2, '0');
        return {
          date:  `${y}-${m}-${d}`,
          count: Number(row.count?.id ?? 0),
        };
      })
      .filter((r) => r.count > 0);

    return NextResponse.json({
      data,
      meta: { collection, field, limit, points: data.length, generated: new Date().toISOString() },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
