export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Use internal Docker hostname when available (after homestack_internal network connect)
// Falls back to public URL (may be behind Authentik)
const GRAFANA_INTERNAL = process.env.GRAFANA_BASE_URL ?? 'http://homestack-grafana:3000';
const GRAFANA_USER     = process.env.GRAFANA_ADMIN_USER ?? 'admin';
const GRAFANA_PASS     = process.env.GRAFANA_ADMIN_PASSWORD ?? '';

function authHeaders() {
  const creds = Buffer.from(`${GRAFANA_USER}:${GRAFANA_PASS}`).toString('base64');
  return { Authorization: `Basic ${creds}` };
}

export async function GET() {
  const headers = authHeaders();

  const [pluginsRes, dashboardsRes, alertRulesRes, dsRes] = await Promise.allSettled([
    fetch(`${GRAFANA_INTERNAL}/api/plugins?enabled=1`,          { headers, signal: AbortSignal.timeout(6000) }),
    fetch(`${GRAFANA_INTERNAL}/api/search?type=dash-db&limit=50`, { headers, signal: AbortSignal.timeout(6000) }),
    fetch(`${GRAFANA_INTERNAL}/api/ruler/grafana/api/v1/rules`, { headers, signal: AbortSignal.timeout(6000) }),
    fetch(`${GRAFANA_INTERNAL}/api/datasources`,                { headers, signal: AbortSignal.timeout(6000) }),
  ]);

  const plugins = pluginsRes.status === 'fulfilled' && pluginsRes.value.ok
    ? await pluginsRes.value.json() : [];
  const dashboards = dashboardsRes.status === 'fulfilled' && dashboardsRes.value.ok
    ? await dashboardsRes.value.json() : [];
  const alertRules = alertRulesRes.status === 'fulfilled' && alertRulesRes.value.ok
    ? await alertRulesRes.value.json() : {};
  const datasources = dsRes.status === 'fulfilled' && dsRes.value.ok
    ? await dsRes.value.json() : [];

  return NextResponse.json({ plugins, dashboards, alertRules, datasources });
}
