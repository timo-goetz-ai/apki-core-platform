'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  RefreshCw, ExternalLink, Activity, Clock,
  AlertTriangle, CheckCircle2, XCircle, Minus,
  Zap, Rocket, Database, FileText, GitBranch,
  ScrollText, TrendingUp, Bot, Server, Play,
  ArrowUpRight, ArrowDownRight,
  ScanSearch, Github, Workflow, Rss, BookOpen,
} from 'lucide-react';
import { HoneycombStatusMap, type ServiceStatus } from '@/components/overview/HoneycombStatusMap';
import { WorkflowPulseGraph } from '@/components/overview/WorkflowPulseGraph';
import { TrendSentimentViz } from '@/components/overview/TrendSentimentViz';
import { GrafanaEmbedPanel } from '@/components/overview/GrafanaEmbedPanel';
import { buildPromGlowMap, type PromSnapshot } from '@/components/overview/promGlow';
import { LiveActivityFeed } from '@/components/overview/LiveActivityFeed';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Workflow { Id: number; Name: string; Status: string; Kategorie: string; n8n_url?: string; }
interface ErrorLog { Id: number | string; ts: string; service: string; level: string; message: string; resolved?: boolean; }
interface CoolifyService { id: string; name: string; kind: string; status: string; fqdn: string | null; updatedAt: string | null; }
interface ActivityItem { id: string; icon: string; text: string; sub: string; ts: number; color: string; }
interface TrendRow { Id?: number; Thema?: string; Kategorie?: string; Score?: number; Sentiment?: string; Wachstum_Prozent?: number; Zusammenfassung?: string; Datum?: string; [k: string]: unknown; }
interface SentimentRow { Id?: number; Thema?: string; Sentiment?: string; Score?: number; Quelle?: string; Datum?: string; [k: string]: unknown; }
interface ContentOppRow { Id?: number; Titel?: string; Beschreibung?: string; Priorität?: string; Kategorie?: string; Datum?: string; [k: string]: unknown; }
interface RssFeedItem { title: string; link: string; pubDate: string; }
interface RssFeed { id: string; name: string; ok: boolean; items: RssFeedItem[]; }
interface ScannerSummary {
  github: { count: number; withClaudeMd: number; error?: string };
  n8n: { count: number; active: number; error?: string };
  nocodb: { count: number; totalFields: number; error?: string };
  rss: { feeds: number; items: number; ok: number };
  durationMs: number;
  scannedAt: string;
}
interface ScannerResult {
  summary: ScannerSummary | null;
  scannedAt: string | null;
  rss?: { feeds: RssFeed[] };
}

// ── Config ─────────────────────────────────────────────────────────────────────
const CORE_SERVICES = [
  { id: 'n8n',        name: 'n8n'        },
  { id: 'nocodb',     name: 'NocoDB'     },
  { id: 'grafana',    name: 'Grafana'    },
  { id: 'coolify',    name: 'Coolify'    },
  { id: 'authentik',  name: 'Authentik'  },
  { id: 'qdrant',     name: 'Qdrant'     },
  { id: 'redis',      name: 'Redis'      },
  { id: 'postgres',   name: 'PostgreSQL' },
  { id: 'prometheus', name: 'Prometheus' },
  { id: 'traefik',    name: 'Traefik'    },
];

const STATUS_COLOR: Record<ServiceStatus, string> = {
  online: '#34d399', degraded: '#fbbf24', offline: '#f87171', unknown: '#475569',
};
const LOG_COLOR: Record<string, string> = {
  info: '#60a5fa', warn: '#fbbf24', error: '#f87171', critical: '#e11d48',
};
const KAT_COLOR: Record<string, string> = {
  'System': '#38bdf8', 'KI-Chat': '#a78bfa', 'Content': '#fb923c',
  'DevOps': '#94a3b8', 'Daten': '#60a5fa', 'Voice': '#f472b6',
  'SaaS': '#fbbf24', 'Job-Scout': '#34d399',
};
const TRIGGERS = [
  { label: 'AI Brain',     id: 'ai-brain',     color: '#a78bfa' },
  { label: 'System Brain', id: 'system-brain', color: '#38bdf8' },
  { label: 'Lead Scout',   id: 'lead-scout',   color: '#34d399' },
  { label: 'Content Gen',  id: 'content-gen',  color: '#fb923c' },
  { label: 'Voice Agent',  id: 'voice-agent',  color: '#f472b6' },
  { label: 'DevOps Bot',   id: 'devops-bot',   color: '#94a3b8' },
];

function orderedServiceIds(statuses: Record<string, { status: string }>): string[] {
  const keys = new Set(Object.keys(statuses));
  const ordered: string[] = [];
  for (const c of CORE_SERVICES) {
    if (keys.has(c.id)) {
      ordered.push(c.id);
      keys.delete(c.id);
    }
  }
  ordered.push(...Array.from(keys).sort((a, b) => a.localeCompare(b)));
  return ordered;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'jetzt';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function Card({ children, style, className }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={['overview-glass-panel', 'overview-glitch-wrap', className].filter(Boolean).join(' ')}
      style={{
        borderRadius: 12,
        padding: '14px 16px',
        height: '100%',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function WHeader({ icon, title, right }: { icon: React.ReactNode; title: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: 'var(--text-muted)', display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>{title}</span>
      </div>
      {right && <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: 3 }}>{right}</span>}
    </div>
  );
}

function Dot({ color, pulse }: { color: string; pulse?: boolean }) {
  return <span style={{
    display: 'inline-block', width: 6, height: 6, borderRadius: '50%',
    background: color, flexShrink: 0,
    animation: pulse ? 'status-pulse 2.5s ease-in-out infinite' : 'none',
  }} />;
}

function LatencyBar({ ms }: { ms: string | undefined }) {
  if (!ms) return null;
  const num = parseInt(ms);
  if (isNaN(num)) return null;
  const pct = Math.min(100, (num / 800) * 100);
  const color = num < 200 ? '#34d399' : num < 500 ? '#fbbf24' : '#f87171';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 36, height: 3, background: 'var(--layer-3)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
      </div>
      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{ms}</span>
    </div>
  );
}

function MiniBar({ data }: { data: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 32 }}>
      {data.map(d => (
        <div key={d.label} title={`${d.label}: ${d.value}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: '100%', borderRadius: 2,
            height: Math.max(3, Math.round((d.value / max) * 28)),
            background: d.color, opacity: 0.8,
          }} />
          <span style={{ fontSize: 7.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const [statuses,    setStatuses]    = useState<Record<string, { status: ServiceStatus; latency?: string }>>({});
  const [workflows,   setWorkflows]   = useState<Workflow[]>([]);
  const [errorLogs,   setErrorLogs]   = useState<ErrorLog[]>([]);
  const [deployments, setDeployments] = useState<CoolifyService[]>([]);
  const [agentCount,  setAgentCount]  = useState(0);
  const [promptCount, setPromptCount] = useState(0);
  const [activity,    setActivity]    = useState<ActivityItem[]>([]);
  const [triggering,  setTriggering]  = useState<string | null>(null);
  const [triggered,   setTriggered]   = useState<string | null>(null);
  const [refreshing,  setRefreshing]  = useState(false);
  const [now,         setNow]         = useState('');
  const [scanner,     setScanner]     = useState<ScannerResult>({ summary: null, scannedAt: null });
  const [scanning,    setScanning]    = useState(false);
  const [trends,      setTrends]      = useState<TrendRow[]>([]);
  const [sentiments,  setSentiments]  = useState<SentimentRow[]>([]);
  const [contentOps,  setContentOps]  = useState<ContentOppRow[]>([]);
  const [promData, setPromData] = useState<PromSnapshot | null>(null);
  const prevOnline = useRef(0);

  useEffect(() => {
    const fmt = () => new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setNow(fmt());
    const t = setInterval(() => setNow(fmt()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    const [svcRes, wfRes, logRes, depRes, agRes, prRes, actRes, scanRes, trendRes, sentRes, oppRes, promRes] = await Promise.allSettled([
      fetch('/api/services').then(r => r.json()),
      fetch('/api/nocodb/table?id=mnwlsxsm0q1k2d2&limit=100').then(r => r.json()),
      fetch('/api/nocodb/error-logs').then(r => r.json()),
      fetch('/api/coolify/services').then(r => r.json()),
      fetch('/api/nocodb/agents').then(r => r.json()),
      fetch('/api/nocodb/table?id=mijlvsujsgqa92m&limit=1').then(r => r.json()),
      fetch('/api/activity').then(r => r.json()),
      fetch('/api/scanner/run').then(r => r.json()),
      fetch('/api/nocodb/table?id=m91y1ifz2aop1ef&limit=10').then(r => r.json()),
      fetch('/api/nocodb/table?id=moigzpvd4yw1d0a&limit=8').then(r => r.json()),
      fetch('/api/nocodb/table?id=m7ehbmbi5t2w0dw&limit=5').then(r => r.json()),
      fetch('/api/monitoring/prometheus').then(r => r.json()),
    ]);

    if (svcRes.status === 'fulfilled') {
      const data = svcRes.value;
      const newOnline = Object.values(data).filter((s: unknown) => (s as { status: string }).status === 'online').length;
      if (prevOnline.current > 0 && newOnline !== prevOnline.current) {
        const diff = newOnline - prevOnline.current;
        const item: ActivityItem = {
          id: `svc-${Date.now()}`, icon: diff > 0 ? '✅' : '⚠️',
          text: diff > 0 ? `${diff} Service(s) wieder online` : `${Math.abs(diff)} Service(s) offline`,
          sub: 'Service Health', ts: Date.now(),
          color: diff > 0 ? '#34d399' : '#f87171',
        };
        setActivity(prev => [item, ...prev].slice(0, 20));
      }
      prevOnline.current = newOnline;
      setStatuses(data);
    }
    if (wfRes.status === 'fulfilled') {
      const list: Workflow[] = Array.isArray(wfRes.value) ? wfRes.value : (wfRes.value?.list ?? []);
      setWorkflows(list);
    }
    if (logRes.status === 'fulfilled') {
      const list: ErrorLog[] = Array.isArray(logRes.value) ? logRes.value : (logRes.value?.list ?? []);
      setErrorLogs(list.filter(l => !l.resolved).slice(0, 8));
    }
    if (depRes.status === 'fulfilled' && depRes.value?.services) {
      setDeployments(depRes.value.services.slice(0, 9));
    }
    if (agRes.status === 'fulfilled') {
      const list = Array.isArray(agRes.value) ? agRes.value : (agRes.value?.list ?? []);
      setAgentCount(list.length);
    }
    if (prRes.status === 'fulfilled') {
      const list = Array.isArray(prRes.value) ? prRes.value : (prRes.value?.list ?? []);
      setPromptCount(list.length);
    }
    if (actRes.status === 'fulfilled') {
      const raw = Array.isArray(actRes.value) ? actRes.value : (actRes.value?.events ?? actRes.value?.list ?? []);
      const items: ActivityItem[] = raw.slice(0, 20).map((e: Record<string, unknown>, i: number) => ({
        id: String(e.id ?? i),
        icon: String(e.icon ?? '▸'),
        text: String(e.message ?? e.text ?? e.action ?? ''),
        sub: String(e.type ?? e.service ?? e.source ?? ''),
        ts: new Date(String(e.time ?? e.ts ?? e.created_at ?? Date.now())).getTime(),
        color: String(e.color ?? '#60a5fa'),
      }));
      if (items.length > 0) setActivity(items);
    }
    if (scanRes.status === 'fulfilled' && scanRes.value?.summary) {
      setScanner(scanRes.value);
    }
    if (trendRes.status === 'fulfilled') {
      const list: TrendRow[] = Array.isArray(trendRes.value) ? trendRes.value : (trendRes.value?.list ?? []);
      setTrends(list.sort((a, b) => (b.Score ?? 0) - (a.Score ?? 0)).slice(0, 5));
    }
    if (sentRes.status === 'fulfilled') {
      const list: SentimentRow[] = Array.isArray(sentRes.value) ? sentRes.value : (sentRes.value?.list ?? []);
      setSentiments(list.slice(0, 6));
    }
    if (oppRes.status === 'fulfilled') {
      const list: ContentOppRow[] = Array.isArray(oppRes.value) ? oppRes.value : (oppRes.value?.list ?? []);
      setContentOps(list.slice(0, 3));
    }
    if (promRes.status === 'fulfilled' && promRes.value && !promRes.value.error) {
      setPromData(promRes.value as PromSnapshot);
    }

    setTimeout(() => setRefreshing(false), 500);
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 30_000);
    return () => clearInterval(t);
  }, [fetchAll]);

  // RSS-Feeds im Hintergrund laden (unabhängig vom langsamen Full-Scanner)
  useEffect(() => {
    fetch('/api/scanner/rss').then(r => r.json()).then(data => {
      if (data?.feeds) setScanner(prev => ({ ...prev, rss: { feeds: data.feeds } }));
    }).catch(() => {});
  }, []);

  // Derived
  const onlineCount  = Object.values(statuses).filter(s => s.status === 'online').length;
  const totalCount   = Object.keys(statuses).length || CORE_SERVICES.length;
  const activeWf     = workflows.filter(w => ['aktiv','active'].includes((w.Status ?? '').toLowerCase())).length;
  const runningDeps  = deployments.filter(d => d.status === 'running').length;
  const openErrors   = errorLogs.length;
  const onlinePct    = totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0;

  const serviceIdsOrdered = useMemo(
    () => (Object.keys(statuses).length ? orderedServiceIds(statuses) : CORE_SERVICES.map((c) => c.id)),
    [statuses],
  );

  const promGlowMap = useMemo(
    () => buildPromGlowMap(serviceIdsOrdered, promData),
    [serviceIdsOrdered, promData],
  );

  const honeyServices = useMemo(
    () =>
      serviceIdsOrdered.map((id) => ({
        id,
        name: CORE_SERVICES.find((c) => c.id === id)?.name ?? id.replace(/-/g, ' '),
        status: (statuses[id]?.status ?? 'unknown') as ServiceStatus,
        latency: statuses[id]?.latency,
        promGlow: promGlowMap[id] ?? 0,
      })),
    [serviceIdsOrdered, statuses, promGlowMap],
  );

  const wfPulseSec = activeWf > 8 ? 1.25 : activeWf > 3 ? 1.65 : activeWf > 0 ? 2 : 2.5;

  const wfKats = Object.entries(
    workflows.reduce((acc, w) => {
      const k = w.Kategorie || 'Other';
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value]) => ({ label, value, color: KAT_COLOR[label] ?? '#475569' }));

  async function runScan() {
    if (scanning) return;
    setScanning(true);
    try {
      const res = await fetch('/api/scanner/run', { method: 'POST' });
      const data = await res.json();
      setScanner(data);
      if (data.summary) {
        setActivity(prev => [{
          id: `scan-${Date.now()}`, icon: '🔍',
          text: `Scanner: ${data.summary.github.count} Repos · ${data.summary.n8n.count} Flows · ${data.summary.rss.items} RSS`,
          sub: 'Knowledge Scanner', ts: Date.now(), color: '#34d399',
        }, ...prev].slice(0, 20));
      }
    } catch { /* silent */ }
    setScanning(false);
  }

  async function triggerWorkflow(id: string) {
    setTriggering(id);
    try { await fetch(`/api/n8n/trigger/${id}`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } }); }
    catch { /* silent */ }
    setTriggered(id);
    setTimeout(() => { setTriggering(null); setTriggered(null); }, 2000);
    // add to activity
    const t = TRIGGERS.find(t => t.id === id);
    if (t) {
      setActivity(prev => [{
        id: `trig-${Date.now()}`, icon: '⚡',
        text: `${t.label} getriggert`, sub: 'n8n Workflow',
        ts: Date.now(), color: t.color,
      }, ...prev].slice(0, 20));
    }
  }

  return (
    <div className="overview-page-grid-bg" style={{ padding: '16px 20px', maxWidth: 1440, margin: '0 auto', position: 'relative', zIndex: 1 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>AIOS Overview</h1>
          <p style={{ margin: '1px 0 0', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            padding: '4px 10px', borderRadius: 6,
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Clock size={10} style={{ color: '#34d399' }} />
            {now}
          </div>
          <button onClick={fetchAll} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
            borderRadius: 6, cursor: 'pointer',
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontSize: 11,
          }}>
            <RefreshCw size={10} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
        {[
          {
            label: 'Services', value: `${onlineCount}/${totalCount}`, sub: `${onlinePct}% uptime`,
            icon: <Server size={12} />, color: onlinePct >= 90 ? '#34d399' : onlinePct >= 70 ? '#fbbf24' : '#f87171',
            trend: onlinePct >= 90 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />,
          },
          {
            label: 'Workflows', value: String(activeWf), sub: `von ${workflows.length} gesamt`,
            icon: <Zap size={12} />, color: '#60a5fa',
            trend: <ArrowUpRight size={11} />,
          },
          {
            label: 'Offene Fehler', value: String(openErrors), sub: 'unresolved',
            icon: <AlertTriangle size={12} />, color: openErrors === 0 ? '#34d399' : openErrors > 3 ? '#f87171' : '#fbbf24',
            trend: openErrors === 0 ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />,
          },
          {
            label: 'Deployments', value: String(runningDeps), sub: `von ${deployments.length} running`,
            icon: <Rocket size={12} />, color: '#60a5fa',
            trend: <ArrowUpRight size={11} />,
          },
        ].map(kpi => (
          <div key={kpi.label} style={{
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '11px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{kpi.label}</span>
              <span style={{ color: kpi.color, display: 'flex', gap: 3, alignItems: 'center' }}>{kpi.icon}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>{kpi.value}</span>
              <span style={{ color: kpi.color, display: 'flex', alignItems: 'center' }}>{kpi.trend}</span>
            </div>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 3, display: 'block' }}>{kpi.sub}</span>
          </div>
        ))}
      </div>

      <GrafanaEmbedPanel />

      {/* ── Main Grid: 2 columns ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(320px, 1fr)', gap: 10, marginBottom: 10 }}>

        {/* Col 1: Honeycomb Health Hub */}
        <Card>
          <WHeader icon={<Activity size={12} />} title="Health Hub" right={`${onlineCount}/${totalCount} · Prom`} />
          <HoneycombStatusMap
            services={honeyServices}
            onlineCount={onlineCount}
            totalCount={totalCount}
            onlinePct={onlinePct}
          />
        </Card>

        {/* Col 2: Workflows List + Error Logs + Knowledge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Aktive Workflows */}
          <Card>
            <WHeader
              icon={<Zap size={12} />}
              title="Workflows"
              right={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#34d399' }}>{activeWf} aktiv</span>
                  <Link href="/workflows" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, fontSize: 9 }}>alle <ExternalLink size={8} /></Link>
                </div>
              }
            />
            {workflows.length === 0 ? (
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', margin: 0 }}>Lade…</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {workflows.slice(0, 8).map(wf => {
                  const isActive = ['aktiv','active'].includes((wf.Status ?? '').toLowerCase());
                  const katColor = KAT_COLOR[wf.Kategorie] ?? '#475569';
                  return (
                    <div key={wf.Id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 8px', borderRadius: 6,
                      background: 'var(--layer-1)', border: '1px solid var(--border)',
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        background: isActive ? '#34d399' : '#475569',
                        boxShadow: isActive ? '0 0 4px #34d39980' : 'none',
                      }} />
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wf.Name}</span>
                      {wf.Kategorie && (
                        <span style={{
                          fontSize: 8, fontFamily: 'var(--font-mono)', color: katColor,
                          background: `${katColor}15`, padding: '1px 5px', borderRadius: 3, flexShrink: 0,
                        }}>{wf.Kategorie}</span>
                      )}
                    </div>
                  );
                })}
                {workflows.length > 8 && (
                  <p style={{ margin: '4px 0 0', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                    +{workflows.length - 8} weitere
                  </p>
                )}
              </div>
            )}
            {/* Kategorie-Bar */}
            {wfKats.length > 0 && (
              <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                <MiniBar data={wfKats} />
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: '2px 8px' }}>
                  {wfKats.map(k => (
                    <span key={k.label} style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      <span style={{ width: 5, height: 5, borderRadius: 1, background: k.color, display: 'inline-block' }} />
                      {k.label} ({k.value})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Error Logs + Knowledge side by side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

            {/* Error Logs */}
            <Card>
              <WHeader
                icon={<ScrollText size={12} />}
                title="Error Logs"
                right={<Link href="/agentic-os/logs" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>alle <ExternalLink size={8} /></Link>}
              />
              {openErrors === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0' }}>
                  <CheckCircle2 size={12} style={{ color: '#34d399' }} />
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Keine Fehler</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {errorLogs.map(log => (
                    <div key={String(log.Id)} style={{
                      padding: '6px 7px', borderRadius: 5,
                      background: 'var(--layer-1)', border: `1px solid ${LOG_COLOR[log.level] ?? '#475569'}22`,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <span style={{
                          fontSize: 7.5, fontFamily: 'var(--font-mono)', fontWeight: 700,
                          color: LOG_COLOR[log.level], textTransform: 'uppercase',
                          padding: '1px 4px', borderRadius: 3,
                          background: `${LOG_COLOR[log.level]}18`,
                        }}>{log.level}</span>
                        <span style={{ flex: 1, fontSize: 8.5, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.service}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Knowledge Base */}
            <Card>
              <WHeader icon={<Database size={12} />} title="Knowledge" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  { label: 'Agents',    value: agentCount,       icon: <Bot size={10} />,       href: '/agentic-os/engine-room/agents',  color: '#a78bfa' },
                  { label: 'Workflows', value: workflows.length,  icon: <Zap size={10} />,       href: '/workflows',                      color: '#38bdf8' },
                  { label: 'Prompts',   value: promptCount,       icon: <FileText size={10} />,  href: '/agentic-os/knowledge/prompts',   color: '#34d399' },
                  { label: 'Templates', value: '—',               icon: <TrendingUp size={10} />,href: '/templates',                      color: '#fb923c' },
                  { label: 'Projekte',  value: '—',               icon: <GitBranch size={10} />, href: '/agentic-os/management/active-projects', color: '#fbbf24' },
                ].map(row => (
                  <Link key={row.label} href={row.href} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '5px 6px', borderRadius: 5,
                      transition: 'background 0.1s',
                    }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--layer-3)'}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                    >
                      <span style={{ color: row.color }}>{row.icon}</span>
                      <span style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)' }}>{row.label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{row.value}</span>
                    </div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
      </div>

      {/* ── Research: Area Charts + Sparklines + Content ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2.1fr) minmax(220px, 0.9fr)', gap: 10, marginBottom: 10 }}>
        <TrendSentimentViz trends={trends} sentiments={sentiments} />
        <Card>
          <WHeader icon={<Rocket size={12} />} title="Content-Chancen" right="täglich" />
          {contentOps.length === 0 ? (
            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', margin: 0 }}>Noch keine Daten — Workflow läuft täglich</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {contentOps.map((c, i) => {
                const prio = (c.Priorität ?? '').toLowerCase();
                const prioColor = prio === 'hoch' || prio === 'high' ? '#f87171' : prio === 'mittel' || prio === 'medium' ? '#fbbf24' : '#34d399';
                return (
                  <div key={c.Id ?? i} style={{ padding: '7px 8px', borderRadius: 6, background: 'var(--layer-1)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                      <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.Titel ?? '—'}</span>
                      {c.Priorität && <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: prioColor, flexShrink: 0, textTransform: 'uppercase' }}>{c.Priorität}</span>}
                    </div>
                    {c.Beschreibung && <p style={{ margin: 0, fontSize: 9.5, color: 'var(--text-muted)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.Beschreibung}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── Knowledge Scanner Row ── */}
      <div style={{ marginBottom: 10 }}>
        <Card>
          <WHeader
            icon={<ScanSearch size={12} />}
            title="Knowledge Scanner"
            right={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {scanner.scannedAt && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                    zuletzt {timeAgo(scanner.scannedAt)}
                  </span>
                )}
                <button
                  onClick={runScan}
                  disabled={scanning}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '3px 8px', borderRadius: 4, cursor: scanning ? 'default' : 'pointer',
                    background: scanning ? 'var(--layer-3)' : 'var(--layer-1)',
                    border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 10,
                  }}
                >
                  <ScanSearch size={9} style={{ animation: scanning ? 'spin 1s linear infinite' : 'none' }} />
                  {scanning ? 'Scant…' : 'Scan Now'}
                </button>
              </div>
            }
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: scanner.rss?.feeds ? 12 : 0 }}>
            {/* GitHub */}
            {(() => {
              const s = scanner.summary?.github;
              return (
                <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Github size={11} style={{ color: s?.error ? '#f87171' : '#a78bfa', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)' }}>GitHub</span>
                    {s?.error && <span style={{ fontSize: 8, color: '#f87171', fontFamily: 'var(--font-mono)' }}>no token</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>{s?.count ?? '—'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Repos</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#a78bfa', lineHeight: 1 }}>{s?.withClaudeMd ?? '—'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>CLAUDE.md</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* n8n */}
            {(() => {
              const s = scanner.summary?.n8n;
              return (
                <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Workflow size={11} style={{ color: s?.error ? '#f87171' : '#38bdf8', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)' }}>n8n Workflows</span>
                    {s?.error && <span style={{ fontSize: 8, color: '#f87171', fontFamily: 'var(--font-mono)' }}>no key</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>{s?.count ?? '—'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Total</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#34d399', lineHeight: 1 }}>{s?.active ?? '—'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Aktiv</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* NocoDB Schema */}
            {(() => {
              const s = scanner.summary?.nocodb;
              return (
                <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Database size={11} style={{ color: '#fb923c', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)' }}>NocoDB Schema</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>{s?.count ?? '—'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Tabellen</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fb923c', lineHeight: 1 }}>{s?.totalFields ?? '—'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Felder</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* RSS */}
            {(() => {
              const s = scanner.summary?.rss;
              return (
                <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 7, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Rss size={11} style={{ color: '#fbbf24', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-primary)' }}>RSS Feeds</span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1 }}>{s?.ok ?? '—'}<span style={{ fontSize: 10, color: 'var(--text-muted)' }}>/{s?.feeds ?? 5}</span></p>
                      <p style={{ margin: '2px 0 0', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Feeds ok</p>
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fbbf24', lineHeight: 1 }}>{s?.items ?? '—'}</p>
                      <p style={{ margin: '2px 0 0', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>Artikel</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* RSS feed items preview */}
          {scanner.rss?.feeds && scanner.rss.feeds.some(f => f.items.length > 0) && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10 }}>
              <p style={{ margin: '0 0 6px', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <BookOpen size={9} /> Letzte Artikel
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px 12px' }}>
                {scanner.rss.feeds.flatMap(f => f.items.slice(0, 2).map(item => ({ ...item, source: f.name }))).slice(0, 9).map((item, i) => (
                  <a
                    key={i}
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'flex-start', gap: 5, padding: '4px 0' }}
                  >
                    <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0, marginTop: 2, background: 'var(--layer-3)', padding: '1px 4px', borderRadius: 3 }}>{item.source}</span>
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={item.title}>{item.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {!scanner.summary && !scanning && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0' }}>
              <ScanSearch size={12} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Noch kein Scan durchgeführt — klicke &quot;Scan Now&quot;</span>
            </div>
          )}
          {scanning && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 0' }}>
              <ScanSearch size={12} style={{ color: '#34d399', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 11, color: '#34d399', fontFamily: 'var(--font-mono)' }}>Scanner läuft — GitHub · n8n · NocoDB · RSS…</span>
            </div>
          )}
        </Card>
      </div>

      {/* ── Bottom Row: Quick Triggers + Activity Feed ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>

        {/* Quick Triggers */}
        <Card>
          <WHeader icon={<Play size={12} />} title="Quick Trigger" right="n8n Workflows" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {TRIGGERS.map(t => {
              const isRunning = triggering === t.id;
              const isDone    = triggered === t.id && !isRunning;
              return (
                <button
                  key={t.id}
                  onClick={() => triggerWorkflow(t.id)}
                  disabled={!!triggering}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 10px', borderRadius: 6, cursor: triggering ? 'default' : 'pointer',
                    background: isRunning ? `${t.color}15` : isDone ? '#34d39915' : 'var(--layer-1)',
                    border: `1px solid ${isRunning ? t.color : isDone ? '#34d399' : 'var(--border)'}`,
                    color: 'var(--text-primary)', fontSize: 11, fontWeight: 500,
                    transition: 'all 0.15s ease', textAlign: 'left', width: '100%',
                  }}
                >
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%', background: isDone ? '#34d399' : t.color, flexShrink: 0,
                    animation: isRunning ? 'status-pulse 0.6s ease-in-out infinite' : 'none',
                  }} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 10.5 }}>
                    {isRunning ? 'Läuft…' : isDone ? 'Gesendet ✓' : t.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 8 }}>
            <Link href="/workflows" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              fontSize: 10, color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-mono)',
            }}>
              Alle Workflows öffnen <ExternalLink size={9} />
            </Link>
          </div>
        </Card>

        {/* Activity Feed — Live Mission Control Ticker */}
        <Card>
          <LiveActivityFeed />
        </Card>
      </div>

    </div>
  );
}
