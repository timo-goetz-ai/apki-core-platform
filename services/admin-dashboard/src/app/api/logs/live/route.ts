export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const BASE  = (process.env.DIRECTUS_URL ?? process.env.NOCODB_URL ?? '').replace(/\/$/, '');
const TOKEN = process.env.DIRECTUS_TOKEN ?? process.env.NOCODB_API_TOKEN ?? '';

// Directus collection (ehem. NocoDB table mgnxselg5bkglr8 = 230_hooks)
const COLLECTION = '230_hooks';

export interface LogEntry {
  id:       string;
  ts:       string;
  level:    'info' | 'warn' | 'error' | 'critical';
  service:  string;
  message:  string;
  details?: string;
}

function normalizeLevel(raw: string | undefined): LogEntry['level'] {
  const l = (raw ?? '').toLowerCase();
  if (l === 'critical') return 'critical';
  if (l === 'error')    return 'error';
  if (l === 'warn' || l === 'warning') return 'warn';
  return 'info';
}

export async function GET() {
  if (!BASE || !TOKEN) {
    return NextResponse.json({ error: 'DIRECTUS_URL oder DIRECTUS_TOKEN nicht konfiguriert', logs: [] });
  }

  try {
    const url = `${BASE}/items/${COLLECTION}?sort[]=-date_created&limit=200`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      signal:  AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Directus ${res.status}: ${text}`, logs: [] });
    }

    const data = await res.json();
    const rows: Record<string, unknown>[] = Array.isArray(data?.data) ? data.data : [];

    const logs: LogEntry[] = rows.map((row) => ({
      id:      String(row.id ?? row.Id ?? Math.random()),
      ts:      String(row.ts ?? row.timestamp ?? row.date_created ?? row.created_at ?? ''),
      level:   normalizeLevel(String(row.level ?? row.Level ?? '')),
      service: String(row.service ?? row.Service ?? row.source ?? row.name ?? '—'),
      message: String(row.message ?? row.Message ?? row.msg ?? row.description ?? ''),
      details: row.details != null ? String(row.details) : undefined,
    }));

    return NextResponse.json({ logs });
  } catch (e) {
    return NextResponse.json({ error: String(e), logs: [] });
  }
}
