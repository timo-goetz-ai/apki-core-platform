export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const PROM = 'https://prometheus.automation-plus-ki.de';

export async function GET() {
  const [targetsRes, alertsRes, upRes] = await Promise.allSettled([
    fetch(`${PROM}/api/v1/targets`, { signal: AbortSignal.timeout(6000) }),
    fetch(`${PROM}/api/v1/alerts`, { signal: AbortSignal.timeout(6000) }),
    fetch(`${PROM}/api/v1/query?query=up`, { signal: AbortSignal.timeout(6000) }),
  ]);

  const targets = targetsRes.status === 'fulfilled' && targetsRes.value.ok
    ? (await targetsRes.value.json()).data?.activeTargets ?? [] : [];
  const alerts = alertsRes.status === 'fulfilled' && alertsRes.value.ok
    ? (await alertsRes.value.json()).data?.alerts ?? [] : [];
  const up = upRes.status === 'fulfilled' && upRes.value.ok
    ? (await upRes.value.json()).data?.result ?? [] : [];

  return NextResponse.json({ targets, alerts, up });
}
