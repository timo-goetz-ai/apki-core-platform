export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const BASE  = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const TOKEN = process.env.SUPABASE_SERVICE_KEY ?? '';

function authHeaders(): Record<string, string> {
  return {
    apikey: TOKEN,
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    Prefer: 'count=exact',
  };
}

// Collection-Map mit lesbaren Labels — synchron mit src/lib/nocodb.ts `C`
const COLLECTIONS: { key: string; label: string }[] = [
  { key: 'workflows',            label: 'Workflows' },
  { key: 'agents',               label: 'Agents' },
  { key: 'subagents',            label: 'Subagents' },
  { key: 'agent_runs',           label: 'Agent Runs' },
  { key: 'prompts',              label: 'Prompts' },
  { key: 'rules',                label: 'Rules' },
  { key: 'skills',               label: 'Skills' },
  { key: 'hooks',                label: 'Hooks' },
  { key: 'mcp_configs',          label: 'MCP Configs' },
  { key: 'plugins',              label: 'Plugins' },
  { key: 'cursor_configs',       label: 'Cursor Configs' },
  { key: 'trends',               label: 'Trends' },
  { key: 'sentiment',            label: 'Sentiment' },
  { key: 'content_opportunities',label: 'Content Opp.' },
  { key: 'knowledge_items',      label: 'Knowledge' },
  { key: 'regulatory',           label: 'Regulatory' },
  { key: 'tools',                label: 'Tools' },
  { key: 'social_proof',         label: 'Social Proof' },
  { key: 'content_pipeline',     label: 'Content Pipeline' },
  { key: 'templates',            label: 'Templates' },
  { key: 'media_assets',         label: 'Media Assets' },
  { key: 'brand_identity',       label: 'Brand Identity' },
  { key: 'publish_log',          label: 'Publish Log' },
  { key: 'clients',              label: 'Clients' },
  { key: 'tasks',                label: 'Tasks' },
  { key: 'mobile_ingest',        label: 'Mobile Ingest' },
];

// PostgREST count: HEAD /rest/v1/{table} with Prefer: count=exact
// → Content-Range: */N in response headers
async function fetchCount(table: string, extraFilter = ''): Promise<number> {
  if (!BASE || !TOKEN) return 0;
  try {
    const url = `${BASE}/rest/v1/${table}?select=*&limit=0${extraFilter}`;
    const res = await fetch(url, {
      method: 'HEAD',
      headers: authHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return 0;
    // Content-Range: */123  or  0-0/123
    const range = res.headers.get('content-range') ?? '';
    const match = range.match(/\/(\d+)$/);
    return match ? Number(match[1]) : 0;
  } catch {
    return 0;
  }
}

async function fetchLastUpdated(table: string): Promise<string> {
  if (!BASE || !TOKEN) return '';
  try {
    const url = `${BASE}/rest/v1/${table}?select=updated_at,created_at&order=updated_at.desc&limit=1`;
    const res = await fetch(url, {
      headers: { apikey: TOKEN, Authorization: `Bearer ${TOKEN}` },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return '';
    const rows = (await res.json()) as Record<string, string>[];
    const item = rows[0];
    return item?.updated_at ?? item?.created_at ?? '';
  } catch {
    return '';
  }
}

export async function GET() {
  if (!BASE || !TOKEN) {
    return NextResponse.json(
      { error: 'SUPABASE_URL oder SUPABASE_SERVICE_KEY nicht konfiguriert' },
      { status: 503 }
    );
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const results = await Promise.allSettled(
    COLLECTIONS.map(async ({ key, label }) => {
      const [total, weekCount, lastUpdated] = await Promise.all([
        fetchCount(key),
        fetchCount(key, `&created_at=gte.${sevenDaysAgo}`),
        fetchLastUpdated(key),
      ]);
      return { collection: key, label, total, weekCount, lastUpdated };
    })
  );

  const data = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { collection: COLLECTIONS[i].key, label: COLLECTIONS[i].label, total: 0, weekCount: 0, lastUpdated: '' }
  );

  const grandTotal = data.reduce((s, d) => s + d.total, 0);
  const weekTotal  = data.reduce((s, d) => s + d.weekCount, 0);

  return NextResponse.json({
    data,
    meta: {
      grandTotal,
      weekTotal,
      collectionCount: COLLECTIONS.length,
      generated: new Date().toISOString(),
    },
  });
}
