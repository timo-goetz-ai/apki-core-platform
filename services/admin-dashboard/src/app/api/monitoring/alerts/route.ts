import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

interface Alert {
  name: string;
  severity: 'critical' | 'warning' | 'info';
  state: 'firing' | 'pending' | 'resolved';
  summary: string;
  startsAt: string;
  labels: Record<string, string>;
}

export async function GET() {
  const prometheusUrl = process.env.PROMETHEUS_URL ?? 'https://prometheus.automation-plus-ki.de';
  const grafanaUrl    = process.env.GRAFANA_URL    ?? 'https://grafana.automation-plus-ki.de';
  const grafanaToken  = process.env.GRAFANA_TOKEN  ?? '';

  const alerts: Alert[] = [];
  const errors: string[] = [];

  // ── Prometheus alertmanager ───────────────────────────────────────────────
  try {
    const res = await fetch(`${prometheusUrl}/api/v1/alerts`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      const raw = data?.data?.alerts ?? [];
      for (const a of raw) {
        if (a.state === 'resolved') continue;
        alerts.push({
          name:     a.labels?.alertname ?? 'Unknown',
          severity: (a.labels?.severity ?? 'info') as Alert['severity'],
          state:    a.state,
          summary:  a.annotations?.summary ?? a.annotations?.description ?? '',
          startsAt: a.activeAt ?? new Date().toISOString(),
          labels:   a.labels ?? {},
        });
      }
    }
  } catch (e) {
    errors.push(`Prometheus: ${e instanceof Error ? e.message : String(e)}`);
  }

  // ── Grafana alerts ────────────────────────────────────────────────────────
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (grafanaToken) headers['Authorization'] = `Bearer ${grafanaToken}`;
    const res = await fetch(`${grafanaUrl}/api/alerts?state=alerting`, {
      headers,
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const data = await res.json();
      const raw = Array.isArray(data) ? data : [];
      for (const a of raw) {
        // avoid duplicates already coming from Prometheus
        const name = a.name ?? a.alertName ?? 'Grafana Alert';
        if (!alerts.find(x => x.name === name)) {
          alerts.push({
            name,
            severity: 'warning',
            state:    'firing',
            summary:  a.message ?? a.executionError ?? '',
            startsAt: a.newStateDate ?? new Date().toISOString(),
            labels:   {},
          });
        }
      }
    }
  } catch (e) {
    errors.push(`Grafana: ${e instanceof Error ? e.message : String(e)}`);
  }

  // sort: critical first, then warning, then by time
  const ORDER = { critical: 0, warning: 1, info: 2 };
  alerts.sort((a, b) => (ORDER[a.severity] - ORDER[b.severity]) || a.startsAt.localeCompare(b.startsAt));

  return NextResponse.json({ alerts, errors, count: alerts.length });
}
