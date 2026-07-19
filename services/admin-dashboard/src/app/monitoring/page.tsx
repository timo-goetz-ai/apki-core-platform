'use client';

import { useState, useEffect, useCallback } from 'react';

// ── Color constants (status-only) ─────────────────────────────────────────────
const C = {
  success: 'var(--accent-green)',
  warning: 'var(--accent-amber)',
  error:   'var(--accent-red)',
  unknown: 'var(--text-secondary)',
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────
interface ServiceHealth {
  id: string;
  status: 'online' | 'degraded' | 'offline' | 'unknown';
  latency?: number;
}

interface PrometheusData {
  targets: PrometheusTarget[];
  alerts:  PrometheusAlert[];
  up:      PromResult[];
  buildInfo: Record<string, string>;
}

interface PrometheusTarget {
  labels:        Record<string, string>;
  health:        string;
  lastError?:    string;
  lastScrape?:   string;
}

interface PrometheusAlert {
  labels:   Record<string, string>;
  state:    string;
  activeAt: string;
}

interface PromResult {
  metric: Record<string, string>;
  value:  [number, string];
}

interface N8nExecution {
  id: string;
  status: string;
  startedAt: string;
  stoppedAt?: string;
  workflowData?: { name?: string };
  workflowId?: string;
  mode?: string;
}

interface MetricPoint { v: number; t: number }
interface MetricHistory { cpu: MetricPoint[]; mem: MetricPoint[]; disk: MetricPoint[]; net_in: MetricPoint[]; net_out: MetricPoint[] }

// ── Key services to show in the top row ──────────────────────────────────────
const KEY_SERVICES = [
  { id: 'n8n',        label: 'n8n'        },
  { id: 'nocodb',     label: 'NocoDB'     },
  { id: 'grafana',    label: 'Grafana'    },
  { id: 'prometheus', label: 'Prometheus' },
  { id: 'authentik',  label: 'Authentik'  },
  { id: 'nexus-core', label: 'Nexus Core' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function statusColor(s: string): string {
  if (s === 'online'  || s === 'up')    return C.success;
  if (s === 'degraded'|| s === 'error') return C.warning;
  if (s === 'offline' || s === 'down')  return C.error;
  return C.unknown;
}

function getMetricColor(pct: number): string {
  if (pct > 85) return C.error;
  if (pct > 65) return C.warning;
  return C.success;
}

function durationStr(start: string, stop?: string): string {
  const s = new Date(start).getTime();
  const e = stop ? new Date(stop).getTime() : Date.now();
  const ms = e - s;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return iso; }
}

function fmtBytes(b: number): string {
  if (b > 1e9) return `${(b / 1e9).toFixed(1)} GB`;
  if (b > 1e6) return `${(b / 1e6).toFixed(1)} MB`;
  return `${(b / 1e3).toFixed(0)} KB`;
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ values, color, width = 120, height = 28 }: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) {
  if (!values.length) return <svg width={width} height={height} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 3, background: 'var(--layer-2)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      <div style={{
        height: '100%',
        width: `${Math.min(Math.max(pct, 0), 100)}%`,
        background: color,
        borderRadius: 2,
        transition: 'width 0.5s ease',
      }} />
    </div>
  );
}

// ── Prometheus query helper (direct from browser — public endpoint) ────────────
const PROM_PUBLIC = 'https://prometheus.automation-plus-ki.de';

async function promQuery(q: string): Promise<number> {
  try {
    const res = await fetch(`${PROM_PUBLIC}/api/v1/query?query=${encodeURIComponent(q)}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return 0;
    const d = await res.json();
    const v = d?.data?.result?.[0]?.value?.[1];
    return v ? parseFloat(v) : 0;
  } catch { return 0; }
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function MonitoringPage() {
  const [services,    setServices]    = useState<Record<string, ServiceHealth>>({});
  const [promData,    setPromData]    = useState<PrometheusData | null>(null);
  const [executions,  setExecutions]  = useState<N8nExecution[]>([]);
  const [metrics,     setMetrics]     = useState<{
    cpu: number; mem: number; memUsed: number; memTotal: number;
    disk: number; uptime: number; netIn: number; netOut: number;
  } | null>(null);
  const [history,     setHistory]     = useState<MetricHistory>({ cpu: [], mem: [], disk: [], net_in: [], net_out: [] });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [spinning,    setSpinning]    = useState(false);

  const fetchAll = useCallback(async () => {
    setSpinning(true);

    // Parallel fetches
    const [svcRes, promRes, n8nRes] = await Promise.allSettled([
      fetch('/api/services').then(r => r.json()),
      fetch('/api/monitoring/prometheus').then(r => r.json()),
      fetch('/api/activity/live').then(r => r.json()),
    ]);

    if (svcRes.status === 'fulfilled') {
      const d = svcRes.value as Record<string, { status: string; latency?: number }>;
      const mapped: Record<string, ServiceHealth> = {};
      for (const [id, v] of Object.entries(d)) {
        mapped[id] = { id, status: v.status as ServiceHealth['status'], latency: v.latency };
      }
      setServices(mapped);
    }

    if (promRes.status === 'fulfilled') {
      setPromData(promRes.value as PrometheusData);
    }

    if (n8nRes.status === 'fulfilled') {
      const d = n8nRes.value as { events: Array<{ type: string; text: string; sub: string; ts: number; color: string; ok: boolean; id: string }> };
      // Convert live events to execution-like objects for the table
      const n8nEvents = (d.events ?? [])
        .filter(e => e.type === 'n8n-execution')
        .slice(0, 20)
        .map(e => ({
          id: e.id,
          status: e.ok ? 'success' : 'error',
          startedAt: new Date(e.ts).toISOString(),
          workflowData: { name: e.text.replace(/ — (success|error|running|unknown)$/, '') },
          mode: e.sub.replace('n8n · ', ''),
        }));
      setExecutions(n8nEvents);
    }

    // Prometheus metrics direct query
    try {
      const [cpu, memPct, memUsed, memTotal, disk, uptime, netIn, netOut] = await Promise.all([
        promQuery('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
        promQuery('(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100'),
        promQuery('node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes'),
        promQuery('node_memory_MemTotal_bytes'),
        promQuery('100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)'),
        promQuery('node_time_seconds - node_boot_time_seconds'),
        promQuery('rate(node_network_receive_bytes_total{device="eth0"}[5m])'),
        promQuery('rate(node_network_transmit_bytes_total{device="eth0"}[5m])'),
      ]);

      const now = Date.now();
      setMetrics({ cpu, mem: memPct, memUsed, memTotal, disk, uptime, netIn, netOut });
      setHistory(prev => {
        const push = (arr: MetricPoint[], v: number) => [...arr.slice(-19), { v, t: now }];
        return {
          cpu:    push(prev.cpu,    cpu),
          mem:    push(prev.mem,    memPct),
          disk:   push(prev.disk,   disk),
          net_in: push(prev.net_in, netIn),
          net_out:push(prev.net_out, netOut),
        };
      });
    } catch { /* silent */ }

    setLastUpdated(new Date());
    setLoading(false);
    setSpinning(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(fetchAll, 30000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const firingAlerts = (promData?.alerts ?? []).filter(a => a.state === 'firing');

  function formatUptime(s: number) {
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
  }

  // ── UI ─────────────────────────────────────────────────────────────────────
  const S = {
    page: {
      padding: '24px 28px 48px',
      background: 'var(--layer-0, var(--layer-0))',
      minHeight: '100vh',
      fontFamily: 'var(--font-ui, system-ui)',
      color: 'var(--text-primary, var(--text-primary))',
    } as React.CSSProperties,
    label: {
      fontSize: 10,
      fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.1em',
      color: 'var(--text-muted, var(--text-muted))',
    },
    sectionTitle: {
      fontSize: 10,
      fontFamily: 'var(--font-mono)',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.12em',
      color: 'var(--text-muted, var(--text-muted))',
      marginBottom: 10,
    },
    card: {
      background: 'var(--layer-2, var(--layer-2))',
      border: '1px solid var(--border, var(--layer-3))',
      borderRadius: 8,
    } as React.CSSProperties,
  };

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary, var(--text-primary))' }}>
            Monitoring
          </h1>
          {firingAlerts.length > 0 && (
            <span style={{
              padding: '2px 8px', borderRadius: 4,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              fontSize: 11, fontFamily: 'var(--font-mono)', color: C.error,
              fontWeight: 600,
            }}>
              {firingAlerts.length} ALERT{firingAlerts.length !== 1 ? 'S' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastUpdated && (
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted, var(--text-muted))' }}>
              Updated {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <span style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontFamily: 'var(--font-mono)', color: C.success,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: C.success,
              animation: 'mon-pulse 2s ease-in-out infinite',
              display: 'inline-block',
            }} />
            Live
          </span>
          <button
            onClick={fetchAll}
            disabled={spinning}
            style={{
              padding: '5px 12px', borderRadius: 6, fontSize: 12,
              background: 'var(--layer-2, var(--layer-2))',
              border: '1px solid var(--border, var(--layer-3))',
              color: 'var(--text-secondary, var(--text-secondary))',
              cursor: spinning ? 'default' : 'pointer',
              opacity: spinning ? 0.5 : 1,
              fontFamily: 'var(--font-ui)',
              transition: 'opacity 0.1s',
            }}
          >
            {spinning ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ── Services row ── */}
      <div style={{ marginBottom: 24 }}>
        <p style={S.sectionTitle}>Services</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {KEY_SERVICES.map(svc => {
            const health = services[svc.id];
            const st = health?.status ?? 'unknown';
            const col = statusColor(st);
            return (
              <div key={svc.id} style={{
                ...S.card,
                padding: '14px 16px',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-bright, var(--layer-3))'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border, var(--layer-3))'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', background: col,
                    flexShrink: 0,
                    animation: st === 'online' ? 'mon-pulse 2.5s ease-in-out infinite' : 'none',
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, var(--text-primary))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {svc.label}
                  </span>
                </div>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: col, marginBottom: 2 }}>
                  {st === 'unknown' && loading ? '…' : st}
                </div>
                {health?.latency !== undefined && (
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted, var(--text-muted))' }}>
                    {health.latency}ms
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Metrics row ── */}
      <div style={{ marginBottom: 24 }}>
        <p style={S.sectionTitle}>System Metrics</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>

          {/* CPU */}
          {(() => {
            const v = metrics?.cpu ?? 0;
            const col = getMetricColor(v);
            const vals = history.cpu.map(p => p.v);
            return (
              <div style={{ ...S.card, padding: '16px 18px' }}>
                <div style={{ ...S.label, marginBottom: 8 }}>CPU Usage</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: loading ? 'var(--text-muted)' : col, marginBottom: 6 }}>
                  {loading ? '…' : `${v.toFixed(1)}%`}
                </div>
                <Bar pct={v} color={col} />
                <div style={{ marginTop: 10 }}>
                  <Sparkline values={vals.length ? vals : [20,25,23,28,22,24,23,26,21,24]} color={col} />
                </div>
              </div>
            );
          })()}

          {/* Memory */}
          {(() => {
            const pct   = metrics?.mem ?? 0;
            const used  = metrics?.memUsed ?? 0;
            const total = metrics?.memTotal ?? 1;
            const col   = getMetricColor(pct);
            const vals  = history.mem.map(p => p.v);
            return (
              <div style={{ ...S.card, padding: '16px 18px' }}>
                <div style={{ ...S.label, marginBottom: 8 }}>Memory</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: loading ? 'var(--text-muted)' : col, marginBottom: 2 }}>
                  {loading ? '…' : `${pct.toFixed(1)}%`}
                </div>
                {metrics && (
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 4 }}>
                    {fmtBytes(used)} / {fmtBytes(total)}
                  </div>
                )}
                <Bar pct={pct} color={col} />
                <div style={{ marginTop: 10 }}>
                  <Sparkline values={vals.length ? vals : [45,48,52,49,55,53,58,54,57,60]} color={col} />
                </div>
              </div>
            );
          })()}

          {/* Disk */}
          {(() => {
            const v = metrics?.disk ?? 0;
            const col = getMetricColor(v);
            const vals = history.disk.map(p => p.v);
            return (
              <div style={{ ...S.card, padding: '16px 18px' }}>
                <div style={{ ...S.label, marginBottom: 8 }}>Disk Usage</div>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', color: loading ? 'var(--text-muted)' : col, marginBottom: 6 }}>
                  {loading ? '…' : `${v.toFixed(1)}%`}
                </div>
                <Bar pct={v} color={col} />
                <div style={{ marginTop: 10 }}>
                  <Sparkline values={vals.length ? vals : [60,60,61,61,62,62,63,63,64,64]} color={col} />
                </div>
              </div>
            );
          })()}

          {/* Network */}
          {(() => {
            const ni = metrics?.netIn ?? 0;
            const no = metrics?.netOut ?? 0;
            const niVals = history.net_in.map(p => p.v);
            return (
              <div style={{ ...S.card, padding: '16px 18px' }}>
                <div style={{ ...S.label, marginBottom: 8 }}>Network eth0</div>
                <div style={{ display: 'flex', gap: 16, marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 2 }}>IN</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: C.success }}>
                      {loading ? '…' : `${fmtBytes(ni)}/s`}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginBottom: 2 }}>OUT</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: C.warning }}>
                      {loading ? '…' : `${fmtBytes(no)}/s`}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: 6 }}>
                  <Sparkline values={niVals.length ? niVals : [1e5,2e5,1.5e5,3e5,2e5,1e5,4e5,2e5,1.5e5,2e5]} color={C.success} />
                </div>
                {metrics && (
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 4 }}>
                    uptime {formatUptime(metrics.uptime)}
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── Firing alerts (if any) ── */}
      {firingAlerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={S.sectionTitle}>Active Alerts</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {firingAlerts.map((a, i) => (
              <div key={i} style={{
                ...S.card,
                padding: '12px 16px',
                borderColor: 'rgba(239,68,68,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.error, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {a.labels.alertname ?? 'Unknown Alert'}
                </span>
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginLeft: 4 }}>
                  {a.labels.instance ?? ''} · {a.labels.severity ?? ''}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  since {fmtTime(a.activeAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Prometheus targets summary ── */}
      {promData && promData.targets.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={S.sectionTitle}>Prometheus Targets ({promData.targets.length})</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
            {promData.targets.slice(0, 12).map((t, i) => {
              const col = t.health === 'up' ? C.success : C.error;
              return (
                <div key={i} style={{
                  ...S.card,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: col, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.labels.job ?? 'unknown'}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: col }}>
                    {t.health}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Workflow Executions table ── */}
      <div>
        <p style={S.sectionTitle}>Recent Workflow Executions</p>
        <div style={{ ...S.card, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr 80px 80px',
            gap: 0,
            padding: '8px 16px',
            borderBottom: '1px solid var(--border, var(--layer-3))',
          }}>
            {['Time', 'Workflow', 'Duration', 'Status'].map(h => (
              <span key={h} style={{ ...S.label }}>{h}</span>
            ))}
          </div>
          {executions.length === 0 ? (
            <div style={{ padding: '24px 16px', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {loading ? 'Loading executions…' : 'No recent executions'}
            </div>
          ) : (
            executions.map((ex, i) => {
              const col = ex.status === 'success' ? C.success : ex.status === 'running' ? 'var(--accent-blue)' : ex.status === 'error' ? C.error : C.unknown;
              const name = ex.workflowData?.name ?? ex.workflowId ?? 'Workflow';
              return (
                <div
                  key={ex.id ?? i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 80px 80px',
                    gap: 0,
                    padding: '9px 16px',
                    borderBottom: i < executions.length - 1 ? '1px solid var(--border, var(--layer-3))' : 'none',
                    transition: 'background 0.1s',
                    cursor: 'default',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--layer-1, var(--layer-1))'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {fmtTime(ex.startedAt)}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                    {name}
                  </span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {durationStr(ex.startedAt, ex.stoppedAt)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: col, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: col }}>
                      {ex.status}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        @keyframes mon-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
