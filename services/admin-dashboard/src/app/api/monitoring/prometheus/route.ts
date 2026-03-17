export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

// Internal Docker hostname — reachable after homestack_internal network connect
// Cron job /usr/local/bin/aios-network-connect.sh ensures this after every deploy
const PROM = process.env.PROMETHEUS_BASE_URL ?? 'http://homestack-prometheus:9090';

export async function GET() {
  const [targetsRes, alertsRes, upRes, buildRes] = await Promise.allSettled([
    fetch(`${PROM}/api/v1/targets`,            { signal: AbortSignal.timeout(6000) }),
    fetch(`${PROM}/api/v1/alerts`,             { signal: AbortSignal.timeout(6000) }),
    fetch(`${PROM}/api/v1/query?query=up`,     { signal: AbortSignal.timeout(6000) }),
    fetch(`${PROM}/api/v1/status/buildinfo`,   { signal: AbortSignal.timeout(6000) }),
  ]);

  const targets = targetsRes.status === 'fulfilled' && targetsRes.value.ok
    ? (await targetsRes.value.json()).data?.activeTargets ?? [] : [];
  const alerts = alertsRes.status === 'fulfilled' && alertsRes.value.ok
    ? (await alertsRes.value.json()).data?.alerts ?? [] : [];
  const up = upRes.status === 'fulfilled' && upRes.value.ok
    ? (await upRes.value.json()).data?.result ?? [] : [];
  const buildInfo = buildRes.status === 'fulfilled' && buildRes.value.ok
    ? (await buildRes.value.json()).data ?? {} : {};

  // Group targets by job for cleaner display
  const byJob: Record<string, typeof targets> = {};
  for (const t of targets) {
    const job = t.labels?.job ?? 'unknown';
    if (!byJob[job]) byJob[job] = [];
    byJob[job].push(t);
  }

  return NextResponse.json({ targets, alerts, up, buildInfo, byJob });
}
