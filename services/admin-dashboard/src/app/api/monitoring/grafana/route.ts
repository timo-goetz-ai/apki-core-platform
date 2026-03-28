export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Grafana läuft hinter Authentik-Proxy → Auth über X-authentik-email Header (intern)
const GRAFANA_BASE = process.env.GRAFANA_BASE_URL ?? 'http://homestack-grafana:3000';
const GRAFANA_PROXY_EMAIL = process.env.GRAFANA_PROXY_EMAIL ?? 'admin@timo-goetz-ai.de';

function authHeaders(): Record<string, string> {
  return {
    'X-authentik-email': GRAFANA_PROXY_EMAIL,
    'X-authentik-username': 'akadmin',
  };
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
