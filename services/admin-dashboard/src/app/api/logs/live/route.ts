export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const BASE    = process.env.NOCODB_URL ?? 'https://nocodb.automation-plus-ki.de';
const TOKEN   = process.env.NOCODB_API_TOKEN ?? '';
const PROJECT = 'pfx0ca6docorj8n';
const TABLE   = 'mgnxselg5bkglr8';

export interface LogEntry {
  id: string;
  ts: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  service: string;
  message: string;
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
  if (!TOKEN) {
    return NextResponse.json({ error: 'NOCODB_API_TOKEN not set', logs: [] }, { status: 200 });
  }

  try {
    const res = await fetch(
      `${BASE}/api/v1/db/data/noco/${PROJECT}/${TABLE}?limit=200&sort=-CreatedAt`,
      {
        headers: { 'xc-token': TOKEN },
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `NocoDB ${res.status}: ${text}`, logs: [] }, { status: 200 });
    }

    const data = await res.json();
    const rows: Record<string, unknown>[] = Array.isArray(data?.list) ? data.list : [];

    const logs: LogEntry[] = rows.map((row) => ({
      id:      String(row.Id ?? row.id ?? row.nc_row_id ?? Math.random()),
      ts:      String(row.ts ?? row.timestamp ?? row.created_at ?? ''),
      level:   normalizeLevel(String(row.level ?? row.Level ?? '')),
      service: String(row.service ?? row.Service ?? row.source ?? '—'),
      message: String(row.message ?? row.Message ?? row.msg ?? ''),
      details: row.details != null ? String(row.details) : undefined,
    }));

    return NextResponse.json({ logs });
  } catch (e) {
    return NextResponse.json({ error: String(e), logs: [] }, { status: 200 });
  }
}
