export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const GRAFANA = 'https://grafana.automation-plus-ki.de';

export async function GET() {
  const [pluginsRes, dashboardsRes, alertsRes] = await Promise.allSettled([
    fetch(`${GRAFANA}/api/plugins?enabled=1`, { signal: AbortSignal.timeout(5000) }),
    fetch(`${GRAFANA}/api/search?type=dash-db&limit=20`, { signal: AbortSignal.timeout(5000) }),
    fetch(`${GRAFANA}/api/alerts?limit=20`, { signal: AbortSignal.timeout(5000) }),
  ]);

  const plugins = pluginsRes.status === 'fulfilled' && pluginsRes.value.ok
    ? await pluginsRes.value.json() : [];
  const dashboards = dashboardsRes.status === 'fulfilled' && dashboardsRes.value.ok
    ? await dashboardsRes.value.json() : [];
  const alerts = alertsRes.status === 'fulfilled' && alertsRes.value.ok
    ? await alertsRes.value.json() : [];

  return NextResponse.json({ plugins, dashboards, alerts });
}
