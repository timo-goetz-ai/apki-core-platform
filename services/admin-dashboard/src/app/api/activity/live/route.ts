import { NextResponse } from 'next/server';
import { activityStore } from '@/lib/activity-store';

export const dynamic = 'force-dynamic';

const N8N_BASE    = process.env.N8N_BASE_URL  ?? 'http://10.0.1.29:5678';
const N8N_API_KEY = process.env.N8N_API_KEY   ?? '***REDACTED_N8N_KEY***';
const PROM_URL    = process.env.PROMETHEUS_URL ?? 'http://10.0.1.29:9090';

interface LiveEvent {
  id:    string;
  icon:  string;
  text:  string;
  sub:   string;
  ts:    number;
  color: string;
  type:  string;
  ok:    boolean;
}

/** GET /api/activity/live
 *  Aggregates: n8n recent executions + Prometheus firing alerts + stored activityStore events */
export async function GET() {
  const live: LiveEvent[] = [];

  // ── 1. n8n executions ─────────────────────────────────────────────────────
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/executions?limit=8&includeData=false`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json() as { data?: Record<string, unknown>[] };
      const executions = data.data ?? [];
      for (const exec of executions) {
        const status  = String(exec.status ?? 'unknown');
        const wfName  = String((exec.workflowData as Record<string, unknown> | undefined)?.name ?? exec.workflowId ?? 'Workflow');
        const startedAt = exec.startedAt ? new Date(String(exec.startedAt)).getTime() : Date.now();
        const color   = status === 'success' ? '#34d399' : status === 'running' ? '#60a5fa' : status === 'error' ? '#f87171' : '#94a3b8';
        const icon    = status === 'success' ? '✅' : status === 'running' ? '⚡' : status === 'error' ? '❌' : '▸';
        live.push({
          id:    `n8n-${String(exec.id)}-${startedAt}`,
          icon,
          text:  `${wfName} — ${status}`,
          sub:   `n8n · ${String(exec.mode ?? 'manual')}`,
          ts:    startedAt,
          color,
          type:  'n8n-execution',
          ok:    status !== 'error',
        });
      }
    }
  } catch { /* no n8n reachable — silent */ }

  // ── 2. Prometheus firing alerts ───────────────────────────────────────────
  try {
    const res = await fetch(`${PROM_URL}/api/v1/alerts`, {
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json() as { data?: { alerts?: Record<string, unknown>[] } };
      const alerts = data.data?.alerts ?? [];
      for (const alert of alerts) {
        if (String(alert.state) !== 'firing') continue;
        const labels    = (alert.labels ?? {}) as Record<string, string>;
        const activeAt  = alert.activeAt ? new Date(String(alert.activeAt)).getTime() : Date.now();
        const severity  = labels.severity ?? 'warning';
        const color     = severity === 'critical' ? '#e11d48' : '#f87171';
        live.push({
          id:    `prom-${labels.alertname ?? 'alert'}-${activeAt}`,
          icon:  '🚨',
          text:  `Alert: ${labels.alertname ?? 'Unknown'} · ${labels.instance ?? ''}`,
          sub:   `Prometheus · ${severity}`,
          ts:    activeAt,
          color,
          type:  'prometheus-alert',
          ok:    false,
        });
      }
    }
  } catch { /* no Prometheus reachable — silent */ }

  // ── 3. Merge with stored activity events ──────────────────────────────────
  const stored = activityStore.events.slice(0, 30).map(e => ({
    id:    e.id,
    icon:  e.ok ? (e.type === 'n8n-trigger' ? '⚡' : e.type === 'scanner' ? '🔍' : '✅') : '❌',
    text:  e.title,
    sub:   e.type,
    ts:    new Date(e.ts).getTime(),
    color: e.ok ? '#34d399' : '#f87171',
    type:  e.type,
    ok:    e.ok,
  }));

  // Deduplicate by id, sort descending
  const seen = new Set<string>();
  const all = [...live, ...stored]
    .filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; })
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 40);

  return NextResponse.json({ events: all, liveCount: live.length });
}
