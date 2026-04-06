export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const BASE  = (process.env.DIRECTUS_URL ?? '').replace(/\/$/, '');
const TOKEN = process.env.DIRECTUS_TOKEN ?? '';

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
}

// Collection-Map mit lesbaren Labels — synchron mit src/lib/nocodb.ts `C`
const COLLECTIONS: { key: string; label: string }[] = [
  { key: '100_workflows',            label: 'Workflows' },
  { key: '110_agents',               label: 'Agents' },
  { key: '120_subagents',            label: 'Subagents' },
  { key: '130_agent_runs',           label: 'Agent Runs' },
  { key: '200_prompts',              label: 'Prompts' },
  { key: '210_rules',                label: 'Rules' },
  { key: '220_skills',               label: 'Skills' },
  { key: '230_hooks',                label: 'Hooks' },
  { key: '240_mcp_configs',          label: 'MCP Configs' },
  { key: '250_plugins',              label: 'Plugins' },
  { key: '260_cursor_configs',       label: 'Cursor Configs' },
  { key: '300_trends',               label: 'Trends' },
  { key: '310_sentiment',            label: 'Sentiment' },
  { key: '320_content_opportunities',label: 'Content Opp.' },
  { key: '330_knowledge_items',      label: 'Knowledge' },
  { key: '340_regulatory',           label: 'Regulatory' },
  { key: '350_tools',                label: 'Tools' },
  { key: '360_social_proof',         label: 'Social Proof' },
  { key: '400_content_pipeline',     label: 'Content Pipeline' },
  { key: '410_templates',            label: 'Templates' },
  { key: '420_media_assets',         label: 'Media Assets' },
  { key: '430_brand_identity',       label: 'Brand Identity' },
  { key: '440_publish_log',          label: 'Publish Log' },
  { key: '500_clients',              label: 'Clients' },
  { key: '510_tasks',                label: 'Tasks' },
  { key: '520_mobile_ingest',        label: 'Mobile Ingest' },
];

interface AggResult { data: { count: { id: string } }[] }

async function fetchCount(collection: string, extraParams = ''): Promise<number> {
  if (!BASE || !TOKEN) return 0;
  try {
    const url = `${BASE}/items/${collection}?aggregate[count]=id&limit=0${extraParams}`;
    const res = await fetch(url, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return 0;
    const json: AggResult = await res.json();
    return Number(json?.data?.[0]?.count?.id ?? 0);
  } catch {
    return 0;
  }
}

async function fetchLastUpdated(collection: string): Promise<string> {
  if (!BASE || !TOKEN) return '';
  try {
    const url = `${BASE}/items/${collection}?fields=date_updated,date_created&sort[]=-date_updated&limit=1`;
    const res = await fetch(url, {
      headers: authHeaders(),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return '';
    const json = await res.json();
    const item = json?.data?.[0];
    return item?.date_updated ?? item?.date_created ?? '';
  } catch {
    return '';
  }
}

export async function GET() {
  if (!BASE || !TOKEN) {
    return NextResponse.json(
      { error: 'DIRECTUS_URL oder DIRECTUS_TOKEN nicht konfiguriert' },
      { status: 503 }
    );
  }

  // 7 Tage ago ISO string
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const results = await Promise.allSettled(
    COLLECTIONS.map(async ({ key, label }) => {
      const [total, weekCount, lastUpdated] = await Promise.all([
        fetchCount(key),
        fetchCount(key, `&filter[date_created][_gte]=${sevenDaysAgo}`),
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
