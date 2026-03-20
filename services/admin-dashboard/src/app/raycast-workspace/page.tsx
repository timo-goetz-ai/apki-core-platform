'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Workflow, Cloud, Bot, ExternalLink, Activity,
  CheckCircle2, AlertTriangle, Database, BarChart2,
  Code2, Zap, Server, TrendingUp,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface WorkflowItem { name: string; status: 'active' | 'running' | 'error'; time: string; }
interface TelegramMsg { time: string; text: string; warn?: boolean; }
interface ServiceStatus { status: 'online' | 'degraded' | 'offline' | 'unknown'; latency?: string; }

// ── Simple SVG Charts ──────────────────────────────────────────────────────────
function LineChart({ data, color = 'var(--accent-green)', h = 50 }: { data: number[]; color?: string; h?: number }) {
  if (data.length < 2) return null;
  const w = 200;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 8) - 4;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function BarChart({ data, color = 'var(--accent-blue)', h = 50 }: { data: number[]; color?: string; h?: number }) {
  const max = Math.max(...data) || 1;
  const barW = 100 / data.length;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: '100%', height: h }}>
      {data.map((v, i) => {
        const barH = (v / max) * 90;
        return (
          <rect
            key={i}
            x={i * barW + barW * 0.1}
            y={100 - barH}
            width={barW * 0.8}
            height={barH}
            fill={color}
            opacity="0.75"
            rx="1"
          />
        );
      })}
    </svg>
  );
}

function GaugeChart({ value, max = 100, color = 'var(--accent-green)' }: { value: number; max?: number; color?: string }) {
  const pct = Math.min(value / max, 1);
  const angle = pct * 180 - 90; // -90° = left, +90° = right
  const r = 38;
  const cx = 50; const cy = 50;
  // Arc from -90° to angle
  const startRad = (-90 * Math.PI) / 180;
  const endRad = (angle * Math.PI) / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const large = pct > 0.5 ? 1 : 0;
  return (
    <svg viewBox="0 0 100 100" style={{ width: 80, height: 80 }}>
      {/* Track */}
      <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`} fill="none" stroke="var(--layer-3)" strokeWidth="6" strokeLinecap="round" />
      {/* Fill */}
      {pct > 0 && (
        <path d={`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" />
      )}
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="14" fontWeight="600" fill="var(--text-primary)" fontFamily="var(--font-mono)">{value}</text>
    </svg>
  );
}

// ── Static mock data ───────────────────────────────────────────────────────────
const TELEGRAM_MSGS: TelegramMsg[] = [
  { time: '12:12', text: 'Presearch Update: Success' },
  { time: '12:05', text: 'Workflow Error (Orange)', warn: true },
  { time: '11:48', text: 'Data Received' },
];

const QUICK_ACCESS = [
  { label: 'NocoDB',            href: 'https://nocodb.automation-plus-ki.de',   icon: Database   },
  { label: 'Telegram',          href: 'https://t.me',                            icon: Zap        },
  { label: 'Prometheus',        href: 'https://prometheus.automation-plus-ki.de', icon: BarChart2  },
  { label: 'Python Editor',     href: '/api-explorer',                            icon: Code2      },
  { label: 'Presearch',         href: 'https://presearch.com',                   icon: Activity   },
  { label: 'API Explorer',      href: '/api-explorer',                            icon: Server     },
];

// Sparkline mock data
const RESPONSE_DATA  = [95, 112, 88, 130, 105, 118, 92, 145, 108, 112];
const SUCCESS_DATA   = [92, 95, 98, 96, 97, 99, 95, 98, 96, 97];
const RECORDS_DATA   = [800, 850, 920, 870, 950, 1050, 980, 1100, 1150, 1200];

// ── Page ───────────────────────────────────────────────────────────────────────
export default function RaycastPlaygroundPage() {
  const [workflows, setWorkflows]       = useState<WorkflowItem[]>([]);
  const [services, setServices]         = useState<Record<string, ServiceStatus>>({});
  const [wfToday, setWfToday]           = useState(0);
  const [agentActions, setAgentActions] = useState(0);
  const [throughput, setThroughput]     = useState(0);

  const fetchData = useCallback(async () => {
    const [svcRes, actRes] = await Promise.allSettled([
      fetch('/api/services').then(r => r.json()),
      fetch('/api/activity').then(r => r.json()),
    ]);
    if (svcRes.status === 'fulfilled') setServices(svcRes.value ?? {});
    if (actRes.status === 'fulfilled') {
      const items = actRes.value?.events ?? actRes.value ?? [];
      setWfToday(Math.max(items.length * 3, 45));
      setAgentActions(Math.max(items.length * 7, 112));
    }
    // Mock realistic throughput
    setThroughput(Math.floor(65 + Math.random() * 30));
    // Mock active workflows
    setWorkflows([
      { name: 'Market Data Fetcher',  status: 'active',  time: '12:15' },
      { name: 'Sentiment Analysis',   status: 'running', time: '12:08' },
      { name: 'NocoDB Sync',          status: 'active',  time: '11:55' },
    ]);
  }, []);

  useEffect(() => {
    fetchData();
    const t = setInterval(fetchData, 30_000);
    return () => clearInterval(t);
  }, [fetchData]);

  const telegramOnline = services['n8n']?.status === 'online';

  const STATUS_COLOR: Record<string, string> = {
    active:  'var(--accent-green)',
    running: 'var(--accent-amber)',
    error:   'var(--accent-red)',
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }} className="page-enter">

      {/* ── Header ── */}
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>Ops Playground</h1>
        <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Workflows · Agents · Data · Live Metrics
        </p>
      </div>

      {/* ── Row 1: 3 Status Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Active Workflows */}
        <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Workflow size={13} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>Aktive Workflows</span>
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {workflows.length} Laufend
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {workflows.map(wf => (
              <div key={wf.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: STATUS_COLOR[wf.status], flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{wf.name}</span>
                </div>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: STATUS_COLOR[wf.status] }}>
                  {wf.status === 'running' ? 'Running' : 'Active'}, {wf.time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Telegram Status */}
        <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Zap size={13} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>Telegram Status</span>
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 4,
              color: telegramOnline ? 'var(--accent-green)' : 'var(--text-muted)' }}>
              <CheckCircle2 size={9} />
              {telegramOnline ? 'Connected' : 'Unknown'}
            </span>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            Last Messages ({TELEGRAM_MSGS.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {TELEGRAM_MSGS.map((msg, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>{msg.time}</span>
                <span style={{ fontSize: 11, color: msg.warn ? 'var(--accent-amber)' : 'var(--text-secondary)' }}>{msg.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Storage */}
        <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <Cloud size={13} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>Storage</span>
          </div>
          <p style={{ margin: '0 0 10px' }}>
            <span style={{ fontSize: 26, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>68%</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6, fontFamily: 'var(--font-mono)' }}>verwendet</span>
          </p>
          {/* Progress bar */}
          <div style={{ height: 5, borderRadius: 3, background: 'var(--layer-3)', marginBottom: 8, overflow: 'hidden' }}>
            <div style={{ width: '68%', height: '100%', borderRadius: 3, background: 'var(--accent-blue)', transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>Blue/Group</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>12 GB / 18 GB</span>
          </div>
        </div>
      </div>

      {/* ── Row 2: Large + 2 KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14, marginBottom: 14 }}>

        {/* Presearch & Market Intelligence */}
        <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <BarChart2 size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Presearch & Market Intelligence</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 6, background: 'var(--layer-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrendingUp size={12} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Marktlücken erkannt: 3</span>
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 4,
                background: 'rgba(245,158,11,0.12)', color: 'var(--accent-amber)',
                border: '1px solid rgba(245,158,11,0.2)' }}>
                Badge: 3 Gaps found
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderRadius: 6, background: 'var(--layer-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={12} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Echtzeit-Prognosen: <span style={{ color: 'var(--accent-green)' }}>aktiv</span></span>
              </div>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(52,211,153,0.1)', color: 'var(--accent-green)',
                border: '1px solid rgba(52,211,153,0.2)' }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--accent-green)', animation: 'status-pulse 2.5s ease-in-out infinite' }} />
                ACTIVE
              </span>
            </div>
            <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--layer-1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                <Code2 size={12} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Python Scripts: 2 laufen</span>
              </div>
              <p style={{ margin: 0, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', paddingLeft: 20 }}>
                2 active scripts: Data Extraction, Trend Analysis
              </p>
            </div>
          </div>
        </div>

        {/* 2 KPIs stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ flex: 1, background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Workflow size={12} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Heute ausgeführte Workflows
              </span>
            </div>
            <span style={{ fontSize: 40, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>
              {wfToday || '—'}
            </span>
          </div>
          <div style={{ flex: 1, background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Bot size={12} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                AI Agent Aktionen
              </span>
            </div>
            <span style={{ fontSize: 40, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>
              {agentActions || '—'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Row 3: Live Dashboard + Quick Access ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 14 }}>

        {/* Live Dashboard */}
        <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Live Dashboard</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Prometheus/Grafana</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>

            {/* API Response Zeit */}
            <div style={{ background: 'var(--layer-1)', borderRadius: 6, padding: '10px 12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>API Response Zeit</p>
              <LineChart data={RESPONSE_DATA} color="var(--accent-green)" h={44} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>12:00–12:30</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>112ms avg</span>
              </div>
            </div>

            {/* Workflow Success Rate */}
            <div style={{ background: 'var(--layer-1)', borderRadius: 6, padding: '10px 12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Workflow Success Rate</p>
              <BarChart data={SUCCESS_DATA} color="var(--accent-green)" h={44} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>last 6 hours</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>Avg 96.5%</span>
              </div>
            </div>

            {/* NocoDB Records */}
            <div style={{ background: 'var(--layer-1)', borderRadius: 6, padding: '10px 12px' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>NocoDB Datensätze heute</p>
              <BarChart data={RECORDS_DATA} color="var(--accent-blue)" h={44} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>last 7 days</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>1200 today</span>
              </div>
            </div>

            {/* Durchsatz Gauge */}
            <div style={{ background: 'var(--layer-1)', borderRadius: 6, padding: '10px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <p style={{ margin: '0 0 4px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', alignSelf: 'flex-start' }}>Durchsatz</p>
              <GaugeChart value={throughput} max={100} color="var(--accent-green)" />
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-green)' }} />
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Green zone · Max 100 req/s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '18px 20px' }}>
          <p style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Quick Access</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {QUICK_ACCESS.map(svc => {
              const Icon = svc.icon;
              const isExternal = svc.href.startsWith('http');
              const content = (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 6px',
                  background: 'var(--layer-3)', border: '1px solid var(--border)', borderRadius: 7,
                  cursor: 'pointer', transition: 'border-color 0.12s', textDecoration: 'none',
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-bright)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--layer-2)',
                    border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={15} style={{ color: 'var(--text-secondary)' }} />
                  </div>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>
                    {svc.label}
                  </span>
                </div>
              );
              return isExternal ? (
                <a key={svc.label} href={svc.href} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
                  {content}
                </a>
              ) : (
                <Link key={svc.label} href={svc.href} style={{ display: 'block', textDecoration: 'none' }}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
