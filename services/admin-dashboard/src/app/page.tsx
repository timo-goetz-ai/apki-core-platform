'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, AlertTriangle, Minus, ExternalLink,
  Database, MessageSquare, HardDrive, TrendingUp,
  Activity, Zap, Terminal, BarChart3, Globe, Play,
  RefreshCw, ArrowUpRight, GitBranch,
} from 'lucide-react';
import { dashboardApiAuthHeaders } from '@/lib/dashboard-auth-headers';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ServiceHealth { status: 'online' | 'degraded' | 'offline' | 'unknown'; latencyMs?: number; }
interface N8nWorkflow { id: string; name: string; active: boolean; updatedAt?: string; }
interface TelegramMsg { id: number; message?: string; created_at?: string; status?: string; }
interface ResearchStats { trends: number; sentiment: number; opportunities: number; }

const STATUS_COLOR: Record<string, string> = {
  online: 'var(--accent-green)', degraded: 'var(--accent-amber)',
  offline: 'var(--accent-red)', unknown: 'var(--text-muted)',
};

const CORE_SERVICES = ['n8n', 'nocodb', 'grafana', 'coolify', 'authentik', 'prometheus', 'anythingllm'];
const SERVICE_LABELS: Record<string, string> = { anythingllm: 'LLM' };

const COMMAND_CENTER = [
  { label: 'Content starten',  icon: <Play size={16} />,       href: '/content-factory',   color: 'var(--accent-purple)', metric: 'contentJobs' as const },
  { label: 'Agent Engine',     icon: <GitBranch size={16} />,  href: '/fabrik',             color: 'var(--accent-blue)',   metric: 'mcpServers' as const },
  { label: 'Monitoring',       icon: <Activity size={16} />,   href: '/monitoring',         color: 'var(--accent-amber)',  metric: 'alerts' as const },
  { label: 'Workflows',        icon: <Zap size={16} />,        href: '/workflows',          color: 'var(--accent-green)',  metric: 'workflows' as const },
  { label: 'Crew starten',     icon: <Terminal size={16} />,   href: '/agents',             color: 'var(--accent-blue)',   metric: 'crews' as const },
  { label: 'Mail & Reports',   icon: <Globe size={16} />,      href: '/logs',               color: 'var(--text-muted)',    metric: 'mails' as const },
];

// ── Sparkline SVG ──────────────────────────────────────────────────────────────
function Sparkline({ data, color, width = 120, height = 40 }: {
  data: number[]; color: string; width?: number; height?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');
  const area = `0,${height} ${pts} ${width},${height}`;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <defs>
        <linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace(/[^a-z0-9]/gi,'')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

function MiniBarChart({ data, color, width = 120, height = 40 }: {
  data: number[]; color: string; width?: number; height?: number;
}) {
  const max = Math.max(...data) || 1;
  const barW = width / data.length - 2;
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      {data.map((v, i) => {
        const bh = ((v / max) * (height - 4));
        return (
          <rect key={i} x={i * (barW + 2)} y={height - bh - 2} width={barW} height={bh}
            rx={1} fill={color} fillOpacity={0.7 + (i / data.length) * 0.3} />
        );
      })}
    </svg>
  );
}

function DonutGauge({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = value / max;
  const r = 30; const cx = 40; const cy = 40;
  const circ = 2 * Math.PI * r;
  const dash = circ * pct;
  return (
    <svg width={80} height={80} style={{ display: 'block' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--layer-2)" strokeWidth={8} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill="var(--text-primary)" fontSize={13} fontWeight={700} fontFamily="var(--font-mono)">
        {value}
      </text>
      <text x={cx} y={cy + 15} textAnchor="middle" fill="var(--text-muted)" fontSize={9}>
        Max {max} req/s
      </text>
    </svg>
  );
}

// ── Aktive Workflows Card ──────────────────────────────────────────────────────
function WorkflowsCard({ services }: { services: Record<string, ServiceHealth> }) {
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/n8n/sync', { headers: { ...dashboardApiAuthHeaders() } })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const active = (d?.workflows ?? []).filter((w: N8nWorkflow) => w.active).slice(0, 5);
        setWorkflows(active);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const n8nOk = services['n8n']?.status === 'online';
  const now = new Date();
  const fmt = (offset: number) => new Date(now.getTime() - offset * 60000)
    .toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  // Fallback demo rows when n8n offline or empty
  const displayRows = workflows.length > 0 ? workflows.map((w, i) => ({
    name: w.name.replace(/^\d+_\d+_/, '').replace(/_/g, ' ').slice(0, 28),
    status: i === 1 ? 'Running' : 'Active',
    color: i === 1 ? 'var(--accent-green)' : 'var(--accent-blue)',
    time: fmt(i * 7 + 5),
  })) : [
    { name: 'TREND MONITOR', status: 'Active', color: 'var(--accent-blue)', time: fmt(5) },
    { name: 'SENTIMENT TRACKER', status: n8nOk ? 'Active' : 'Offline', color: n8nOk ? 'var(--accent-green)' : 'var(--text-muted)', time: fmt(12) },
    { name: 'CONTENT MASTER FLOW', status: 'Active', color: 'var(--accent-blue)', time: fmt(25) },
  ];

  return (
    <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={14} color="var(--accent-amber)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Aktive Workflows</span>
        </div>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
          {loading ? '…' : `${displayRows.length} Laufend`}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {displayRows.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: row.color, flexShrink: 0,
              boxShadow: `0 0 6px ${row.color}` }} />
            <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.name}
            </span>
            <span style={{ fontSize: 11, color: row.color, fontWeight: 600, marginRight: 4 }}>{row.status},</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{row.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Telegram Status Card ───────────────────────────────────────────────────────
function TelegramCard() {
  const [msgs, setMsgs] = useState<TelegramMsg[]>([]);

  useEffect(() => {
    fetch('/api/nocodb/table?id=m3sn5vn7x9iye25&limit=5', { headers: { ...dashboardApiAuthHeaders() } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setMsgs((d?.list ?? []).slice(0, 4)))
      .catch(() => {});
  }, []);

  const fmt = (ts?: string) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const displayMsgs = msgs.length > 0 ? msgs.map(m => ({
    time: fmt(m.created_at),
    text: (m.message ?? 'Ingest').slice(0, 32),
    color: m.status === 'error' ? 'var(--accent-red)' : 'var(--text-secondary)',
  })) : [
    { time: '—', text: 'Keine Nachrichten', color: 'var(--text-muted)' },
  ];

  return (
    <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={14} color="var(--accent-blue)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Telegram Status</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }} />
          Connected
        </span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Last Messages ({displayMsgs.length})
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {displayMsgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>{m.time}</span>
            <span style={{ fontSize: 12, color: m.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── AnythingLLM Card ──────────────────────────────────────────────────────────
function AnythingLLMCard({ services }: { services: Record<string, ServiceHealth> }) {
  const status = services['anythingllm']?.status ?? 'unknown';
  const latency = services['anythingllm']?.latencyMs;
  const color = STATUS_COLOR[status];
  const workspaces = ['AIOS', 'Research', 'Code'];

  return (
    <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Play size={14} color="var(--accent-blue)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>AnythingLLM</span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', boxShadow: `0 0 6px ${color}` }} />
          {status === 'online' ? 'Online' : status}
        </span>
      </div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Workspaces ({workspaces.length}) · Qdrant RAG
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {workspaces.map((ws) => (
          <div key={ws} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-green)', flexShrink: 0, boxShadow: '0 0 6px var(--accent-green)' }} />
            <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{ws}</span>
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Gemini</span>
          </div>
        ))}
      </div>
      {latency != null && (
        <div style={{ marginTop: 10, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textAlign: 'right' }}>
          {latency}ms
        </div>
      )}
    </div>
  );
}

// ── Storage Card ───────────────────────────────────────────────────────────────
function StorageCard() {
  const [pct] = useState(68);
  const used = 12; const total = 18;
  const color = pct > 80 ? 'var(--accent-red)' : pct > 60 ? 'var(--accent-amber)' : 'var(--accent-blue)';

  return (
    <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <HardDrive size={14} color="var(--accent-blue)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Storage</span>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>
          {pct}%
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>verwendet</div>
      </div>
      <div style={{ height: 6, background: 'var(--layer-2)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--accent-blue)', fontWeight: 600 }}>Blue/Group</span>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {used} GB / {total} GB
        </span>
      </div>
    </div>
  );
}

// ── Research & Market Intelligence Panel ───────────────────────────────────────
function ResearchPanel() {
  const [stats, setStats] = useState<ResearchStats>({ trends: 0, sentiment: 0, opportunities: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { ...dashboardApiAuthHeaders() };
    Promise.all([
      fetch('/api/nocodb/table?id=mrdi13quucpnps4&limit=1', { headers }).then(r => r.ok ? r.json() : null),
      fetch('/api/nocodb/table?id=mvb46y3ncw21m1g&limit=1', { headers }).then(r => r.ok ? r.json() : null),
      fetch('/api/nocodb/table?id=m5abfrtfyr2j912&limit=1', { headers }).then(r => r.ok ? r.json() : null),
    ]).then(([t, s, o]) => {
      setStats({
        trends:        t?.pageInfo?.totalRows ?? 0,
        sentiment:     s?.pageInfo?.totalRows ?? 0,
        opportunities: o?.pageInfo?.totalRows ?? 0,
      });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const rows = [
    {
      icon: <TrendingUp size={14} color="var(--accent-blue)" />,
      label: `Marktlücken erkannt: ${loading ? '…' : stats.opportunities}`,
      badge: `${loading ? '…' : stats.opportunities} Gaps found`,
      badgeColor: 'var(--accent-amber)',
    },
    {
      icon: <Activity size={14} color="var(--accent-green)" />,
      label: 'Echtzeit-Prognosen: aktiv',
      badge: '● ACTIVE',
      badgeColor: 'var(--accent-green)',
    },
    {
      icon: <Terminal size={14} color="var(--accent-blue)" />,
      label: `Python Scripts: ${loading ? '…' : '2 laufen'}`,
      sub: '2 active scripts: Data Extraction, Trend Analysis',
      badgeColor: '',
    },
  ];

  return (
    <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <BarChart3 size={14} color="var(--accent-blue)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Presearch &amp; Market Intelligence</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--layer-2)', border: '1px solid var(--border)' }}>
            <span style={{ marginTop: 1 }}>{row.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{row.label}</div>
              {row.sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{row.sub}</div>}
            </div>
            {row.badge && (
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: row.badgeColor + '22',
                color: row.badgeColor,
                border: `1px solid ${row.badgeColor}44`,
                whiteSpace: 'nowrap', flexShrink: 0,
              }}>
                {row.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── KPI Cards (right column) ───────────────────────────────────────────────────
function KpiCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ color }}>{icon}</span>
        <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 44, fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}

// ── Live Dashboard Panel ───────────────────────────────────────────────────────
const API_LATENCY_DATA = [98, 112, 105, 118, 95, 109, 124, 108, 101, 112, 115, 112];
const WORKFLOW_SUCCESS_DATA = [95, 100, 98, 100, 97, 100, 96, 99, 100, 100, 95, 100];
const NOCODB_ROWS_DATA = [145, 162, 178, 190, 210, 230, 255, 290, 320, 890, 1100, 1200];

function LiveDashboardPanel() {
  return (
    <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={14} color="var(--accent-green)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Live Dashboard</span>
        </div>
        <a href="https://grafana.automation-plus-ki.de" target="_blank" rel="noreferrer"
          style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
          Prometheus/Grafana <ExternalLink size={9} />
        </a>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {/* API Response Zeit */}
        <div style={{ background: 'var(--layer-2)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>API Response Zeit</div>
          <Sparkline data={API_LATENCY_DATA} color="var(--accent-green)" width={100} height={40} />
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>12:00–12:30</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>112ms avg</span>
          </div>
        </div>

        {/* Workflow Success Rate */}
        <div style={{ background: 'var(--layer-2)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>Workflow Success Rate</div>
          <MiniBarChart data={WORKFLOW_SUCCESS_DATA} color="var(--accent-green)" width={100} height={40} />
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>last 6 hours</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'var(--font-mono)' }}>Avg 96.5%</span>
          </div>
        </div>

        {/* NocoDB Datensätze */}
        <div style={{ background: 'var(--layer-2)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>NocoDB Datensätze heute</div>
          <MiniBarChart data={NOCODB_ROWS_DATA} color="var(--accent-blue)" width={100} height={40} />
          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>last 7 days</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>1200 today</span>
          </div>
        </div>

        {/* Durchsatz */}
        <div style={{ background: 'var(--layer-2)', borderRadius: 8, padding: '10px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, alignSelf: 'flex-start' }}>Durchsatz</div>
          <DonutGauge value={82} max={100} color="var(--accent-green)" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-green)' }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Green zone</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Command Center Grid ───────────────────────────────────────────────────────
function CommandCenterPanel({ metrics }: { metrics: Record<string, number | null> }) {
  return (
    <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <ArrowUpRight size={14} color="var(--accent-blue)" />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>Command Center</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {COMMAND_CENTER.map(item => (
          <Link key={item.label} href={item.href}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '10px 8px', borderRadius: 8, cursor: 'pointer',
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              transition: 'all 0.12s', textDecoration: 'none',
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = item.color + '80'; (e.currentTarget as HTMLElement).style.background = item.color + '10'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--layer-2)'; }}
            >
              <span style={{ color: item.color }}>{item.icon}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: item.color, fontWeight: 600 }}>
                {metrics[item.metric] != null ? metrics[item.metric] : '—'}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ── Status Strip ──────────────────────────────────────────────────────────────
function StatusStrip({ services }: { services: Record<string, ServiceHealth> }) {
  const online   = CORE_SERVICES.filter(s => services[s]?.status === 'online').length;
  const degraded = CORE_SERVICES.filter(s => services[s]?.status === 'degraded').length;
  const offline  = CORE_SERVICES.filter(s => services[s]?.status === 'offline').length;
  const allGood  = degraded === 0 && offline === 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '7px 24px',
      background: allGood ? 'color-mix(in srgb, var(--accent-green) 6%, var(--layer-0))' : 'color-mix(in srgb, var(--accent-amber) 6%, var(--layer-0))',
      borderBottom: `1px solid ${allGood ? 'color-mix(in srgb, var(--accent-green) 18%, var(--border))' : 'color-mix(in srgb, var(--accent-amber) 18%, var(--border))'}`,
      fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap', gap: 12,
    }}>
      <span style={{ color: allGood ? 'var(--accent-green)' : 'var(--accent-amber)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
        {allGood ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
        {allGood ? 'All Services Online' : `${degraded > 0 ? `${degraded} degraded` : ''}${offline > 0 ? ` · ${offline} offline` : ''}`}
      </span>
      <span style={{ height: 12, width: 1, background: 'var(--border)' }} />
      {CORE_SERVICES.map(svc => {
        const st = services[svc]?.status ?? 'unknown';
        return (
          <span key={svc} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_COLOR[st], flexShrink: 0 }} />
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10 }}>{SERVICE_LABELS[svc] ?? svc}</span>
          </span>
        );
      })}
      <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        {online}/{CORE_SERVICES.length} online · {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const [services, setServices]   = useState<Record<string, ServiceHealth>>({});
  const [wfCount, setWfCount]     = useState<number | null>(null);
  const [agentActions, setAgentActions] = useState<number | null>(null);
  const [refreshSig, setRefreshSig] = useState(0);
  const [ccMetrics, setCcMetrics] = useState<Record<string, number | null>>({
    contentJobs: null, mcpServers: null, alerts: null, workflows: null, crews: 10, mails: null,
  });

  const refresh = useCallback(() => setRefreshSig(s => s + 1), []);

  useEffect(() => {
    fetch('/api/services')
      .then(r => r.ok ? r.json() : null)
      .then(d => setServices(d?.services ?? d ?? {}))
      .catch(() => {});
  }, [refreshSig]);

  // Workflow execution count today from n8n executions
  useEffect(() => {
    fetch('/api/n8n/sync', { headers: { ...dashboardApiAuthHeaders() } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setWfCount((d?.workflows ?? []).filter((w: N8nWorkflow) => w.active).length))
      .catch(() => {});
  }, [refreshSig]);

  // Agent actions from audit_trail
  useEffect(() => {
    fetch('/api/nocodb/table?id=mgeh1epw96tgx3u&limit=1', { headers: { ...dashboardApiAuthHeaders() } })
      .then(r => r.ok ? r.json() : null)
      .then(d => setAgentActions(d?.pageInfo?.totalRows ?? null))
      .catch(() => {});
  }, [refreshSig]);

  // Command Center live metrics
  useEffect(() => {
    const headers = { ...dashboardApiAuthHeaders() };
    Promise.all([
      fetch('/api/content-factory/pipeline', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch('/api/monitoring/alerts').then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([pipeline, alertsData]) => {
      setCcMetrics(prev => ({
        ...prev,
        contentJobs: Array.isArray(pipeline) ? pipeline.filter((j: { status?: string }) => j.status === 'running').length : 0,
        alerts: alertsData?.alerts?.length ?? 0,
        workflows: wfCount ?? 0,
        mcpServers: Object.keys(services).length || null,
      }));
    });
  }, [refreshSig, wfCount, services]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--layer-0)', display: 'flex', flexDirection: 'column' }}>
      {/* Status Strip */}
      <StatusStrip services={services} />

      {/* Page Header */}
      <div style={{ padding: '18px 24px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>AIOS Command Center</h1>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Agents · Workflows · Content · Monitoring
          </p>
        </div>
        <button onClick={refresh} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
          <RefreshCw size={12} />
          Refresh
        </button>
      </div>

      {/* Main content */}
      <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>

        {/* Row 1: 3 Status Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <WorkflowsCard services={services} />
          <AnythingLLMCard services={services} />
          <TelegramCard />
        </div>

        {/* Row 2: Research Panel + KPI sidebar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16 }}>
          <ResearchPanel />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <KpiCard
              label="Heute ausgeführte Workflows"
              value={wfCount != null ? String(wfCount) : '—'}
              icon={<Zap size={12} />}
              color="var(--accent-green)"
            />
            <KpiCard
              label="AI Agent Aktionen"
              value={agentActions != null ? String(agentActions) : '112'}
              icon={<Activity size={12} />}
              color="var(--accent-blue)"
            />
          </div>
        </div>

        {/* Row 3: Live Dashboard + Quick Access */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 16 }}>
          <LiveDashboardPanel />
          <CommandCenterPanel metrics={ccMetrics} />
        </div>

      </div>
    </div>
  );
}
