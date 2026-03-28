'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, Cpu, HardDrive, Server, Wifi, RefreshCw, ExternalLink, AlertTriangle } from 'lucide-react';

const PROMETHEUS = 'https://prometheus.automation-plus-ki.de';
const GRAFANA = 'https://grafana.automation-plus-ki.de';

const GRAFANA_DASHBOARDS = [
  { title: 'Operations',       url: `${GRAFANA}/d/aios-operations`, icon: Activity  },
  { title: 'Research/Content', url: `${GRAFANA}/d/aios-research`,   icon: HardDrive },
  { title: 'Logs',             url: `${GRAFANA}/d/aios-logs`,       icon: Server    },
  { title: 'Containers',       url: `${GRAFANA}/d/aios-containers`, icon: Cpu       },
];

// ── Prometheus helper ──────────────────────────────────────────────────────
async function queryPrometheus(q: string): Promise<number> {
  const res = await fetch(`${PROMETHEUS}/api/v1/query?query=${encodeURIComponent(q)}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const val = data?.data?.result?.[0]?.value?.[1];
  return val ? parseFloat(val) : 0;
}

// ── Formatting helpers ─────────────────────────────────────────────────────
function getColor(pct: number): string {
  if (pct > 85) return 'var(--accent-red)';
  if (pct > 65) return 'var(--accent-amber)';
  return 'var(--accent-green)';
}

function formatBytes(bytes: number): string {
  if (bytes > 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes > 1e6) return `${(bytes / 1e6).toFixed(1)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

// ── MetricCard ─────────────────────────────────────────────────────────────
interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  pct?: number;
  icon: React.ReactNode;
  color?: string;
  loading?: boolean;
}

function MetricCard({ label, value, unit, pct, icon, color, loading }: MetricCardProps) {
  return (
    <div style={{
      background: 'var(--layer-2)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px',
      minWidth: 160,
      flex: '1 1 160px',
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: 'var(--text-secondary)' }}>
        {icon}
        <span style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          {label}
        </span>
      </div>

      {/* Value */}
      <div style={{
        fontSize: 32,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        color: loading ? 'var(--text-muted)' : (color || 'var(--text-primary)'),
        minHeight: 44,
        display: 'flex',
        alignItems: 'baseline',
        gap: 4,
      }}>
        {loading ? (
          <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            loading…
          </span>
        ) : (
          <>
            {value}
            {unit && (
              <span style={{ fontSize: 16, color: 'var(--text-secondary)', marginLeft: 2 }}>
                {unit}
              </span>
            )}
          </>
        )}
      </div>

      {/* Progress bar */}
      {pct !== undefined && !loading && (
        <div style={{ marginTop: 12, height: 4, background: 'var(--layer-3)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${Math.min(Math.max(pct, 0), 100)}%`,
            background: getColor(pct),
            borderRadius: 2,
            transition: 'width 0.5s ease, background 0.3s ease',
          }} />
        </div>
      )}
    </div>
  );
}

// ── Metrics state ──────────────────────────────────────────────────────────
interface Metrics {
  cpuPct: number;
  ramPct: number;
  ramUsed: number;
  ramTotal: number;
  diskPct: number;
  uptime: number;
  containers: number;
  netIn: number;
  netOut: number;
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function MetricsPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [spinning, setSpinning] = useState(false);

  const loadMetrics = useCallback(async () => {
    setSpinning(true);
    setError(null);
    try {
      const [
        cpuPct,
        ramPct,
        ramUsed,
        ramTotal,
        diskPct,
        uptime,
        containers,
        netIn,
        netOut,
      ] = await Promise.all([
        queryPrometheus('100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'),
        queryPrometheus('(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100'),
        queryPrometheus('node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes'),
        queryPrometheus('node_memory_MemTotal_bytes'),
        queryPrometheus('100 - ((node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) * 100)'),
        queryPrometheus('node_time_seconds - node_boot_time_seconds'),
        queryPrometheus('count(container_last_seen{name!=""})'),
        queryPrometheus('rate(node_network_receive_bytes_total{device="eth0"}[5m])'),
        queryPrometheus('rate(node_network_transmit_bytes_total{device="eth0"}[5m])'),
      ]);

      setMetrics({ cpuPct, ramPct, ramUsed, ramTotal, diskPct, uptime, containers, netIn, netOut });
      setLastUpdated(new Date());
      setCountdown(30);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Prometheus unreachable — ${msg}`);
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, []);

  // Initial load + 30s auto-refresh
  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  // Countdown ticker
  useEffect(() => {
    if (loading || error) return;
    const tick = setInterval(() => {
      setCountdown(c => (c <= 1 ? 30 : c - 1));
    }, 1000);
    return () => clearInterval(tick);
  }, [loading, error]);

  const isLoading = loading || !metrics;

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', fontFamily: 'var(--font-ui, inherit)' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28, flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Activity size={22} color="var(--accent-blue)" />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              System Metrics
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              Live data from Prometheus · {PROMETHEUS}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {lastUpdated && (
            <span style={{
              fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
            }}>
              Updated {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          {!error && !isLoading && (
            <span style={{
              fontSize: 11, fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)',
              background: 'var(--layer-2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '3px 8px',
            }}>
              refresh in {countdown}s
            </span>
          )}
          <button
            onClick={loadMetrics}
            disabled={spinning}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 8, fontSize: 12,
              background: 'var(--layer-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              cursor: spinning ? 'default' : 'pointer',
              opacity: spinning ? 0.6 : 1,
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => { if (!spinning) e.currentTarget.style.background = 'var(--layer-3)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--layer-2)'; }}
          >
            <RefreshCw
              size={13}
              style={{
                transition: 'transform 0.4s',
                transform: spinning ? 'rotate(360deg)' : 'rotate(0deg)',
                animation: spinning ? 'spin 0.8s linear infinite' : 'none',
              }}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error state ── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: 'rgba(248,113,113,0.07)',
          border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 10, padding: '16px 20px', marginBottom: 24,
        }}>
          <AlertTriangle size={18} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--accent-red)' }}>
              Could not fetch metrics
            </p>
            <p style={{ margin: '4px 0 12px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              {error}
            </p>
            <button
              onClick={loadMetrics}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 7, fontSize: 12,
                background: 'rgba(248,113,113,0.12)',
                border: '1px solid rgba(248,113,113,0.3)',
                color: 'var(--accent-red)', cursor: 'pointer',
              }}
            >
              <RefreshCw size={12} /> Retry
            </button>
          </div>
        </div>
      )}

      {/* ── Metric cards ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 20,
      }}>
        <MetricCard
          label="CPU"
          value={isLoading ? '' : `${metrics.cpuPct.toFixed(1)}`}
          unit="%"
          pct={metrics?.cpuPct}
          icon={<Cpu size={13} />}
          color={metrics ? getColor(metrics.cpuPct) : undefined}
          loading={isLoading}
        />
        <MetricCard
          label="RAM %"
          value={isLoading ? '' : `${metrics.ramPct.toFixed(1)}`}
          unit="%"
          pct={metrics?.ramPct}
          icon={<Server size={13} />}
          color={metrics ? getColor(metrics.ramPct) : undefined}
          loading={isLoading}
        />
        <MetricCard
          label="Disk %"
          value={isLoading ? '' : `${metrics.diskPct.toFixed(1)}`}
          unit="%"
          pct={metrics?.diskPct}
          icon={<HardDrive size={13} />}
          color={metrics ? getColor(metrics.diskPct) : undefined}
          loading={isLoading}
        />
        <MetricCard
          label="Uptime"
          value={isLoading ? '' : formatUptime(metrics.uptime)}
          icon={<Activity size={13} />}
          color="var(--accent-blue)"
          loading={isLoading}
        />
        <MetricCard
          label="Containers"
          value={isLoading ? '' : `${Math.round(metrics.containers)}`}
          icon={<Server size={13} />}
          color="var(--accent-purple)"
          loading={isLoading}
        />
      </div>

      {/* ── RAM detail row ── */}
      {!isLoading && metrics && (
        <div style={{
          background: 'var(--layer-2)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            RAM
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {formatBytes(metrics.ramUsed)} used
            <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>/</span>
            {formatBytes(metrics.ramTotal)} total
          </span>
          <div style={{ flex: 1, minWidth: 120, height: 6, background: 'var(--layer-3)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(metrics.ramPct, 100)}%`,
              background: getColor(metrics.ramPct),
              borderRadius: 3,
              transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      {/* ── Network row ── */}
      <div style={{
        background: 'var(--layer-2)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px 20px',
        marginBottom: 28,
        display: 'flex',
        alignItems: 'center',
        gap: 28,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-secondary)' }}>
          <Wifi size={15} />
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Network (eth0)
          </span>
        </div>
        {isLoading ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>loading…</span>
        ) : metrics ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, color: 'var(--accent-green)' }}>↓</span>
              <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
                {formatBytes(metrics.netIn)}/s
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>in</span>
            </div>
            <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16, color: 'var(--accent-amber)' }}>↑</span>
              <span style={{ fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--accent-amber)' }}>
                {formatBytes(metrics.netOut)}/s
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>out</span>
            </div>
          </>
        ) : null}
      </div>

      {/* ── Grafana dashboards ── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        paddingTop: 24,
      }}>
        <p style={{
          margin: '0 0 14px',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--text-muted)',
        }}>
          Grafana Dashboards
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {GRAFANA_DASHBOARDS.map(({ title, url, icon: Icon }) => (
            <a
              key={title}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '9px 16px', borderRadius: 8, fontSize: 13,
                background: 'var(--layer-2)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--layer-3)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.borderColor = 'var(--border-bright)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--layer-2)';
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <Icon size={13} />
              {title}
              <ExternalLink size={10} style={{ color: 'var(--text-muted)' }} />
            </a>
          ))}
        </div>
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          → Opens in new tab at {GRAFANA}
        </p>
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
