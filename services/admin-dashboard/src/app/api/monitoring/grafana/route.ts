export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Public URL (lokal/dev) oder interner Docker-Hostname (Production)
const GRAFANA_BASE = process.env.GRAFANA_BASE_URL ?? 'http://homestack-grafana:3000';
const GRAFANA_USER = process.env.GRAFANA_ADMIN_USER ?? 'admin';
const GRAFANA_PASS = process.env.GRAFANA_ADMIN_PASSWORD ?? '';
const GRAFANA_TOKEN = process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN ?? '';

function authHeaders(): Record<string, string> {
  if (GRAFANA_TOKEN) {
    return { Authorization: `Bearer ${GRAFANA_TOKEN}` };
  }
  const creds = Buffer.from(`${GRAFANA_USER}:${GRAFANA_PASS}`).toString('base64');
  return { Authorization: `Basic ${creds}` };
}

async function gFetch(path: string) {
  const res = await fetch(`${GRAFANA_BASE}${path}`, {
    headers: { ...authHeaders(), Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Grafana ${res.status} ${path}`);
  return res.json();
}

export async function GET() {
  const headers = authHeaders();

  const [dashboardsRes, dsRes, pluginsRes] = await Promise.allSettled([
    fetch(`${GRAFANA_BASE}/api/search?type=dash-db&limit=100`, {
      headers: { ...headers, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    }),
    fetch(`${GRAFANA_BASE}/api/datasources`, {
      headers: { ...headers, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    }),
    fetch(`${GRAFANA_BASE}/api/plugins?enabled=1`, {
      headers: { ...headers, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    }),
  ]);

  let dashboards: unknown[] = [];
  let datasources: unknown[] = [];
  let plugins: unknown[] = [];
  let error: string | undefined;

  if (dashboardsRes.status === 'fulfilled' && dashboardsRes.value.ok) {
    dashboards = await dashboardsRes.value.json();
  } else if (dashboardsRes.status === 'fulfilled') {
    error = `Grafana HTTP ${dashboardsRes.value.status} — möglicherweise Authentik-Block`;
  } else {
    error = String((dashboardsRes as PromiseRejectedResult).reason);
  }

  if (dsRes.status === 'fulfilled' && dsRes.value.ok) {
    datasources = await dsRes.value.json();
  }
  if (pluginsRes.status === 'fulfilled' && pluginsRes.value.ok) {
    plugins = await pluginsRes.value.json();
  }

  return NextResponse.json({ dashboards, datasources, plugins, error, grafanaUrl: GRAFANA_BASE });
}
