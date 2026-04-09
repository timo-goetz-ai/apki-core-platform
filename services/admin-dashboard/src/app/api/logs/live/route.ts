export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const BASE  = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const TOKEN = process.env.SUPABASE_SERVICE_KEY ?? '';

// Supabase table (ehem. Directus 230_hooks)
const TABLE = 'hooks';

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
    return NextResponse.json({ error: 'SUPABASE_URL oder SUPABASE_SERVICE_KEY nicht konfiguriert', logs: [] });
  }

  try {
    const url = `${BASE}/rest/v1/${TABLE}?select=*&order=created_at.desc&limit=200`;
    const res = await fetch(url, {
      headers: { apikey: TOKEN, Authorization: `Bearer ${TOKEN}` },
      signal:  AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Supabase ${res.status}: ${text}`, logs: [] });
    }

    const rows: Record<string, unknown>[] = await res.json();

    const logs: LogEntry[] = rows.map((row) => ({
      id:      String(row.id ?? Math.random()),
      ts:      String(row.ts ?? row.timestamp ?? row.created_at ?? ''),
      level:   normalizeLevel(String(row.level ?? '')),
      service: String(row.service ?? row.source ?? row.name ?? '—'),
      message: String(row.message ?? row.msg ?? row.description ?? ''),
      details: row.details != null ? String(row.details) : undefined,
    }));

    return NextResponse.json({ logs });
  } catch (e) {
    return NextResponse.json({ error: String(e), logs: [] });
  }
}
