export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { runGithubScan, runN8nScan, runNocodbSchemaScan, runRssScan } from '@/lib/scanners';
import { pushEvent } from '@/lib/activity-store';

// In-memory cache for last run result
const g = globalThis as typeof globalThis & {
  __scannerLastRun?: {
    summary: Record<string, unknown>;
    scannedAt: string;
  };
};

/**
 * POST /api/scanner/run — triggers all scanners, returns combined results + summary.
 * GET  /api/scanner/run — returns last cached run summary (or null).
 */
export async function POST() {
  const start = Date.now();

  const [gh, n8n, noco, rss] = await Promise.all([
    runGithubScan(),
    runN8nScan(),
    runNocodbSchemaScan(),
    runRssScan(),
  ]);

  const summary = {
    github: {
      count: gh.repos.length,
      withClaudeMd: gh.repos.filter(r => r.hasClaudeMd).length,
      error: gh.error,
    },
    n8n: {
      count: n8n.workflows.length,
      active: n8n.workflows.filter(w => w.active).length,
      error: n8n.error,
    },
    nocodb: {
      count: noco.tables.length,
      totalFields: noco.tables.reduce((s, t) => s + t.fieldCount, 0),
      error: noco.error,
    },
    rss: {
      feeds: rss.feeds.length,
      items: rss.feeds.reduce((s, f) => s + f.items.length, 0),
      ok: rss.feeds.filter(f => f.ok).length,
    },
    durationMs: Date.now() - start,
    scannedAt: new Date().toISOString(),
  };

  g.__scannerLastRun = { summary, scannedAt: summary.scannedAt };

  pushEvent(
    'scanner',
    'Knowledge Scanner',
    `${summary.github.count} Repos · ${summary.n8n.count} Workflows · ${summary.rss.items} RSS`,
    true,
  );

  return NextResponse.json({ summary, github: gh, n8n, nocodb: noco, rss });
}

export async function GET() {
  return NextResponse.json(g.__scannerLastRun ?? { summary: null, scannedAt: null });
}
