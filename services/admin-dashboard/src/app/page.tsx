'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, AlertTriangle, Minus, ExternalLink,
  Play, Zap, TrendingUp, Clock, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TimelineFeed } from '@/components/overview/TimelineFeed';
import { dashboardApiAuthHeaders } from '@/lib/dashboard-auth-headers';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ServiceHealth { status: 'online' | 'degraded' | 'offline' | 'unknown'; latencyMs?: number; }
interface ContentPending { Id: number; topic: string; tone?: string; confidence_score?: number; }

const STATUS_DOT: Record<string, string> = {
  online: 'var(--accent-green)', degraded: 'var(--accent-amber)', offline: 'var(--accent-red)', unknown: 'var(--text-muted)',
};
const STATUS_ICON = {
  online:   <CheckCircle2 size={11} />,
  degraded: <AlertTriangle size={11} />,
  offline:  <AlertTriangle size={11} />,
  unknown:  <Minus size={11} />,
};

const CORE_SERVICES = ['n8n', 'nocodb', 'grafana', 'coolify', 'authentik', 'prometheus'];

const QUICK_TRIGGERS = [
  { label: 'Trend-Scan',    id: 'fEYWN4pWhRcG2tLg', accent: 'var(--accent-blue)' },
  { label: 'Content-Gen',   id: 'xptdJvE2eiTNTtK0', accent: 'var(--accent-purple)' },
  { label: 'Daily Digest',  id: 'zb9g2zj7SKptuBRq', accent: 'var(--accent-amber)' },
];

function confidenceAmpel(score?: number): string {
  if (score == null) return '⚪';
  if (score > 85) return '🟢';
  if (score > 50) return '🟡';
  return '🔴';
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusStrip({ services }: { services: Record<string, ServiceHealth> }) {
  const online   = CORE_SERVICES.filter(s => services[s]?.status === 'online').length;
  const degraded = CORE_SERVICES.filter(s => services[s]?.status === 'degraded').length;
  const offline  = CORE_SERVICES.filter(s => services[s]?.status === 'offline').length;
  const allGood  = degraded === 0 && offline === 0;

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      padding: '8px 20px',
      background: allGood ? 'color-mix(in srgb, var(--accent-green) 8%, var(--layer-0))' : 'color-mix(in srgb, var(--accent-amber) 8%, var(--layer-0))',
      borderBottom: allGood ? '1px solid color-mix(in srgb, var(--accent-green) 22%, var(--border))' : '1px solid color-mix(in srgb, var(--accent-amber) 22%, var(--border))',
      fontSize: 11, color: 'var(--text-muted)', flexWrap: 'wrap', gap: 12,
    }}>
      <span style={{ color: allGood ? 'var(--accent-green)' : 'var(--accent-amber)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
        {allGood ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
        {allGood ? 'Alle Services online' : `${degraded > 0 ? `${degraded} degraded` : ''}${offline > 0 ? ` · ${offline} offline` : ''}`}
      </span>

      <span style={{ height: 12, width: 1, background: 'var(--border)' }} />

      {CORE_SERVICES.map(svc => {
        const s = services[svc];
        const st = s?.status ?? 'unknown';
        return (
          <span key={svc} style={{ display: 'flex', alignItems: 'center', gap: 4, color: STATUS_DOT[st] }}>
            {STATUS_ICON[st as keyof typeof STATUS_ICON]}
            <span style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 10 }}>{svc}</span>
          </span>
        );
      })}

      <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
        {online}/{CORE_SERVICES.length} online · {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
}

function PendingCard({ item, onAction }: { item: ContentPending; onAction: () => void }) {
  const [loading, setLoading] = useState<'approve' | 'discard' | null>(null);

  async function act(action: 'approve' | 'discard') {
    setLoading(action);
    try {
      await fetch(`/api/nocodb/table?id=m48nvpornrxuba9`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...dashboardApiAuthHeaders() },
        body: JSON.stringify({ Id: item.Id, status: action === 'approve' ? 'approved' : 'discarded' }),
      });
      onAction();
    } finally { setLoading(null); }
  }

  return (
    <div style={{
      padding: '10px 12px', borderRadius: 8,
      background: 'var(--layer-1)', border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 10 }}>{confidenceAmpel(item.confidence_score)}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {item.topic}
        </span>
      </div>
      {item.tone && (
        <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--layer-2)', borderRadius: 3, padding: '1px 6px', display: 'inline-block', marginBottom: 8 }}>
          {item.tone}
        </span>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="success" size="sm" className="flex-1 text-xs font-bold" onClick={() => act('approve')} disabled={!!loading}>
          {loading === 'approve' ? '…' : '✅ Freigeben'}
        </Button>
        <Button type="button" variant="secondary" size="sm" className="flex-1 text-xs font-bold text-[--text-muted]" onClick={() => act('discard')} disabled={!!loading}>
          {loading === 'discard' ? '…' : '🗑️ Verwerfen'}
        </Button>
      </div>
    </div>
  );
}

function QuickTrigger({ wf, onDone }: { wf: typeof QUICK_TRIGGERS[0]; onDone: () => void }) {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle');

  async function trigger() {
    if (state === 'running') return;
    setState('running');
    try {
      const res = await fetch(`/api/n8n/trigger/${wf.id}`, { method: 'POST', headers: { ...dashboardApiAuthHeaders() } });
      setState(res.ok ? 'done' : 'error');
      if (res.ok) { setTimeout(() => { setState('idle'); onDone(); }, 3000); }
    } catch { setState('error'); }
  }

  const bg =
    state === 'running' ? `color-mix(in srgb, ${wf.accent} 14%, var(--layer-1))`
    : state === 'done' ? 'color-mix(in srgb, var(--accent-green) 14%, var(--layer-1))'
    : state === 'error' ? 'color-mix(in srgb, var(--accent-red) 14%, var(--layer-1))'
    : 'var(--layer-1)';
  const bdr =
    state === 'running' ? wf.accent
    : state === 'done' ? 'var(--accent-green)'
    : state === 'error' ? 'var(--accent-red)'
    : 'var(--border)';
  const label = state === 'running' ? 'Läuft…' : state === 'done' ? 'Gestartet ✓' : state === 'error' ? 'Fehler' : wf.label;

  return (
    <button type="button" onClick={trigger} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--layer-0)]" style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '8px 12px', borderRadius: 7, border: `1px solid ${bdr}`,
      background: bg, cursor: 'pointer', width: '100%',
      fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', transition: 'all 0.15s',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: state === 'done' ? 'var(--accent-green)' : wf.accent, flexShrink: 0,
        animation: state === 'running' ? 'pulse-dot 0.8s ease-in-out infinite' : 'none' }} />
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      <Play size={10} color="var(--text-muted)" />
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function OverviewPage() {
  const [services, setServices]           = useState<Record<string, ServiceHealth>>({});
  const [pending, setPending]             = useState<ContentPending[]>([]);
  const [trendCount, setTrendCount]       = useState<number | null>(null);
  const [refreshSig, setRefreshSig]       = useState(0);

  const refresh = useCallback(() => setRefreshSig(s => s + 1), []);

  // Load service health
  useEffect(() => {
    fetch('/api/services')
      .then(r => r.json())
      .then(d => setServices(d?.services ?? d ?? {}))
      .catch(() => {});
  }, [refreshSig]);

  // Load pending approvals from content_pipeline
  useEffect(() => {
    fetch('/api/nocodb/table?id=m48nvpornrxuba9&limit=20', { headers: { ...dashboardApiAuthHeaders() } })
      .then(r => r.json())
      .then(d => {
        const rows: ContentPending[] = (d?.list ?? [])
          .filter((r: Record<string, unknown>) => r.status === 'pending_approval')
          .map((r: Record<string, unknown>) => ({
            Id:               r.Id as number,
            topic:            r.topic as string ?? '—',
            tone:             r.tone as string | undefined,
            confidence_score: r.confidence_score as number | undefined,
          }));
        setPending(rows);
      })
      .catch(() => {});
  }, [refreshSig]);

  // Load trend count
  useEffect(() => {
    fetch('/api/nocodb/table?id=m91y1ifz2aop1ef&limit=1', { headers: { ...dashboardApiAuthHeaders() } })
      .then(r => r.json())
      .then(d => setTrendCount(d?.pageInfo?.totalRows ?? null))
      .catch(() => {});
  }, [refreshSig]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--layer-0)', display: 'flex', flexDirection: 'column' }}>

      {/* Status Strip */}
      <StatusStrip services={services} />

      {/* Main layout: Timeline (2/3) + Sidebar (1/3) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 0, flex: 1, minHeight: 0 }}>

        {/* ── Timeline ── */}
        <div style={{ padding: '20px 24px', borderRight: '1px solid var(--border)', overflowY: 'auto' }}>
          <TimelineFeed key={refreshSig} />
        </div>

        {/* ── Sidebar ── */}
        <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>

          {/* Pending Approvals */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Clock size={13} color="var(--accent-purple)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Freigabe ausstehend</span>
              {pending.length > 0 && (
                <span style={{ marginLeft: 'auto', background: 'var(--accent-purple)', color: 'white', borderRadius: 10, fontSize: 10, fontWeight: 700, padding: '1px 7px' }}>
                  {pending.length}
                </span>
              )}
            </div>
            {pending.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                ✅ Nichts ausstehend
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pending.slice(0, 5).map(item => (
                  <PendingCard key={item.Id} item={item} onAction={refresh} />
                ))}
                {pending.length > 5 && (
                  <Link href="/content-factory" style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    +{pending.length - 5} weitere <ArrowRight size={10} />
                  </Link>
                )}
              </div>
            )}
          </section>

          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* Quick Triggers */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Zap size={13} color="var(--accent-amber)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>Quick Trigger</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {QUICK_TRIGGERS.map(wf => (
                <QuickTrigger key={wf.id} wf={wf} onDone={refresh} />
              ))}
            </div>
          </section>

          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* System Snapshot */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <TrendingUp size={13} color="var(--accent-green)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>System Snapshot</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <Row label="Trends in DB" value={trendCount != null ? String(trendCount) : '…'} color="var(--accent-green)" />
              <Row label="Freigaben offen" value={String(pending.length)} color={pending.length > 0 ? 'var(--accent-purple)' : 'var(--accent-green)'} />
              <Row label="Services online" value={`${CORE_SERVICES.filter(s => services[s]?.status === 'online').length}/${CORE_SERVICES.length}`} color="var(--accent-blue)" />
            </div>
          </section>

          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* Nav shortcuts */}
          <section>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                { href: '/workflows',      label: 'Workflows',       icon: '⚡' },
                { href: '/content-factory', label: 'Content Factory', icon: '✍️' },
                { href: '/monitoring',     label: 'Monitoring',      icon: '📊' },
                { href: '/agents',         label: 'Agents',          icon: '🤖' },
              ].map(item => (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  borderRadius: 7, textDecoration: 'none', fontSize: 12,
                  color: 'var(--text-secondary)', background: 'var(--layer-1)',
                  border: '1px solid transparent', transition: 'all 0.12s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-bright)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  <ExternalLink size={9} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>{value}</span>
    </div>
  );
}
