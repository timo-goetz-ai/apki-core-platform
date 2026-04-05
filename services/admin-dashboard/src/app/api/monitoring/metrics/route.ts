export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const PROM = process.env.PROMETHEUS_BASE_URL ?? 'http://homestack-prometheus:9090';

async function promQuery(query: string): Promise<number | null> {
  try {
    const res = await fetch(
      `${PROM}/api/v1/query?query=${encodeURIComponent(query)}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const val = data?.data?.result?.[0]?.value?.[1];
    return val != null ? parseFloat(val) : null;
  } catch {
    return null;
  }
}

async function promRangeQuery(query: string, stepSeconds = 120, rangeMinutes = 30): Promise<number[]> {
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - rangeMinutes * 60;
    const res = await fetch(
      `${PROM}/api/v1/query_range?query=${encodeURIComponent(query)}&start=${start}&end=${end}&step=${stepSeconds}`,
      { signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) return [];
    const data = await res.json();
    const values = data?.data?.result?.[0]?.values;
    if (!Array.isArray(values)) return [];
    return values.map((v: [number, string]) => parseFloat(v[1]));
  } catch {
    return [];
  }
}

export async function GET() {
  const [cpu, ram, disk, uptime, cpuHistory, ramHistory, diskHistory] = await Promise.all([
    // Current values
    promQuery('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
    promQuery('(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100'),
    promQuery('(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100'),
    promQuery('node_time_seconds - node_boot_time_seconds'),
    // Sparkline history (30min, 2min steps = 15 data points)
    promRangeQuery('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
    promRangeQuery('(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100'),
    promRangeQuery('(1 - node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100'),
  ]);

  // Convert uptime seconds to days
  const uptimeDays = uptime != null ? Math.floor(uptime / 86400) : null;

  return NextResponse.json({
    cpu: cpu != null ? Math.round(cpu * 10) / 10 : null,
    ram: ram != null ? Math.round(ram * 10) / 10 : null,
    disk: disk != null ? Math.round(disk * 10) / 10 : null,
    uptimeDays,
    cpuHistory,
    ramHistory,
    diskHistory,
  });
}
