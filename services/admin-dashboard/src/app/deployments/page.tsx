'use client';

import { useEffect, useState, useCallback } from 'react';

/* ─── Types ─────────────────────────────────────────────────────── */

interface DeploymentEntry {
  id: string;
  sha: string;
  message: string;
  author: string;
  ts: string;
  branch: string;
  status: 'success' | 'building' | 'failed' | 'unknown';
  services: string[];
}

interface CoolifyService {
  id: string;
  name: string;
  kind: string;
  status: string;
  fqdn: string | null;
  repo: string | null;
  updatedAt: string | null;
}

/* ─── Helpers ────────────────────────────────────────────────────── */

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return '—'; }
}

function statusColor(s: string): string {
  if (s === 'running')                         return '#34d399';
  if (s === 'stopped' || s === 'exited')       return '#ef4444';
  if (s === 'starting' || s === 'restarting')  return '#f59e0b';
  return '#94a3b8';
}

function deployStatusColor(s: DeploymentEntry['status']): string {
  if (s === 'success')  return '#34d399';
  if (s === 'building') return '#f59e0b';
  if (s === 'failed')   return '#ef4444';
  return '#94a3b8';
}

function deployStatusLabel(s: DeploymentEntry['status']): string {
  if (s === 'success')  return 'deployed';
  if (s === 'building') return 'building';
  if (s === 'failed')   return 'failed';
  return 'unknown';
}

/* ─── Page ───────────────────────────────────────────────────────── */

export default function DeploymentsPage() {
  const [commits, setCommits]       = useState<DeploymentEntry[]>([]);
  const [services, setServices]     = useState<CoolifyService[]>([]);
  const [loadingC, setLoadingC]     = useState(true);
  const [loadingS, setLoadingS]     = useState(true);
  const [errorC, setErrorC]         = useState<string | null>(null);
  const [errorS, setErrorS]         = useState<string | null>(null);
  const [restartingId, setRestartingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadCommits = useCallback(async () => {
    setLoadingC(true);
    setErrorC(null);
    try {
      const res = await fetch('/api/deployments/history');
      const data = await res.json();
      if (data.error && !data.commits?.length) setErrorC(data.error);
      else setCommits(data.commits ?? []);
    } catch (e) {
      setErrorC(String(e));
    } finally {
      setLoadingC(false);
    }
  }, []);

  const loadServices = useCallback(async () => {
    setLoadingS(true);
    setErrorS(null);
    try {
      const res = await fetch('/api/coolify/services');
      const data = await res.json();
      if (data.error && !data.services?.length) setErrorS(data.error);
      else setServices(data.services ?? []);
    } catch (e) {
      setErrorS(String(e));
    } finally {
      setLoadingS(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadCommits(), loadServices()]);
    setRefreshing(false);
  }, [loadCommits, loadServices]);

  useEffect(() => {
    loadCommits();
    loadServices();
  }, [loadCommits, loadServices]);

  const handleRestart = async (id: string) => {
    setRestartingId(id);
    try {
      await fetch(`/api/coolify/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid: id, action: 'restart' }),
      });
      setTimeout(loadServices, 2000);
    } catch { /* silent */ }
    finally { setTimeout(() => setRestartingId(null), 2000); }
  };

  const running  = services.filter(s => s.status === 'running').length;
  const exited   = services.filter(s => s.status === 'stopped' || s.status === 'exited').length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Deployments
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            TimoGoetz1988/aios · main
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={refresh}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 7, fontSize: 12, fontFamily: 'var(--font-mono)',
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            <span style={{ display: 'inline-block', animation: refreshing ? 'spin 0.7s linear infinite' : 'none', fontSize: 13 }}>↺</span>
            Refresh
          </button>
          <a
            href="https://github.com/TimoGoetz1988/aios/actions"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 7, fontSize: 12, fontFamily: 'var(--font-mono)',
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', textDecoration: 'none',
            }}
          >
            GitHub Actions ↗
          </a>
          <a
            href="https://coolify.automation-plus-ki.de"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 7, fontSize: 12, fontFamily: 'var(--font-mono)',
              background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.3)',
              color: '#34d399', textDecoration: 'none', fontWeight: 600,
            }}
          >
            Deploy now ↗
          </a>
        </div>
      </div>

      {/* ── Stats strip ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Commits',  value: loadingC ? '…' : String(commits.length), color: 'var(--text-primary)' },
          { label: 'Running',  value: loadingS ? '…' : String(running),         color: '#34d399' },
          { label: 'Exited',   value: loadingS ? '…' : String(exited),          color: exited > 0 ? '#ef4444' : 'var(--text-muted)' },
          { label: 'Services', value: loadingS ? '…' : String(services.length), color: 'var(--text-primary)' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 10,
            padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 90,
          }}>
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Commit history table ─────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 10,
        }}>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Commit History · main
          </span>
          <a
            href="https://github.com/TimoGoetz1988/aios/commits/main"
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            View all on GitHub ↗
          </a>
        </div>

        {errorC && (
          <div style={{
            padding: '10px 14px', borderRadius: 7, marginBottom: 10, fontSize: 12,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444',
            fontFamily: 'var(--font-mono)',
          }}>
            {errorC}
          </div>
        )}

        <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '80px 1fr 140px 90px 100px 90px',
            gap: 0,
            padding: '8px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            background: 'var(--layer-2)',
          }}>
            <span>SHA</span>
            <span>Message</span>
            <span>Author</span>
            <span>Time</span>
            <span>Services</span>
            <span>Status</span>
          </div>

          {loadingC && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Loading commits…
            </div>
          )}

          {!loadingC && commits.length === 0 && !errorC && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              No commits found. Check GITHUB_TOKEN env var.
            </div>
          )}

          {commits.map((c, idx) => {
            const sColor = deployStatusColor(c.status);
            const isOdd  = idx % 2 === 1;
            return (
              <div
                key={c.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr 140px 90px 100px 90px',
                  gap: 0,
                  padding: '9px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: isOdd ? 'rgba(255,255,255,0.012)' : 'transparent',
                  alignItems: 'center',
                  fontSize: 12,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isOdd ? 'rgba(255,255,255,0.012)' : 'transparent'; }}
              >
                {/* SHA */}
                <a
                  href={`https://github.com/TimoGoetz1988/aios/commit/${c.id}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
                    color: '#94a3b8', textDecoration: 'none',
                    background: 'var(--layer-3)', padding: '2px 7px', borderRadius: 4,
                    display: 'inline-block', width: 'fit-content',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8'; }}
                >
                  {c.sha}
                </a>

                {/* Message */}
                <span style={{
                  color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap', paddingRight: 12, fontFamily: 'var(--font-ui)',
                }}>
                  {c.message}
                </span>

                {/* Author */}
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.author}
                </span>

                {/* Time */}
                <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  {timeAgo(c.ts)}
                </span>

                {/* Services */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  {c.services.slice(0, 2).map(svc => (
                    <span key={svc} style={{
                      fontSize: 9, padding: '1px 6px', borderRadius: 3,
                      background: 'var(--layer-3)', color: 'var(--text-muted)',
                      fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap',
                    }}>
                      {svc}
                    </span>
                  ))}
                  {c.services.length > 2 && (
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      +{c.services.length - 2}
                    </span>
                  )}
                </div>

                {/* Status + Rollback */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: sColor, fontSize: 9 }}>●</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: sColor }}>
                    {deployStatusLabel(c.status)}
                  </span>
                  <a
                    href="https://coolify.automation-plus-ki.de"
                    target="_blank" rel="noopener noreferrer"
                    title="Rollback via Coolify"
                    style={{
                      marginLeft: 4, fontSize: 9, padding: '2px 6px', borderRadius: 4,
                      background: 'var(--layer-3)', border: '1px solid var(--border)',
                      color: 'var(--text-muted)', textDecoration: 'none',
                      fontFamily: 'var(--font-mono)',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)'; }}
                  >
                    ↩
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Active Services (Coolify) ─────────────────────────── */}
      <div>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 10 }}>
          Active Services · Coolify
        </span>

        {errorS && (
          <div style={{
            padding: '10px 14px', borderRadius: 7, marginBottom: 10, fontSize: 12,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444',
            fontFamily: 'var(--font-mono)',
          }}>
            {errorS}
          </div>
        )}

        <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '200px 130px 1fr 80px',
            padding: '8px 16px',
            borderBottom: '1px solid var(--border)',
            fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.08em',
            background: 'var(--layer-2)',
          }}>
            <span>Service</span>
            <span>Status</span>
            <span>Domain</span>
            <span></span>
          </div>

          {loadingS && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Loading services…
            </div>
          )}

          {!loadingS && services.length === 0 && !errorS && (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              No services found. Check COOLIFY_URL and COOLIFY_API_KEY.
            </div>
          )}

          {services.map((svc, idx) => {
            const color   = statusColor(svc.status);
            const isOdd   = idx % 2 === 1;
            const domain  = svc.fqdn ? svc.fqdn.replace(/^https?:\/\//, '').split('/')[0] : null;
            const isDown  = svc.status === 'stopped' || svc.status === 'exited';
            const isBusy  = restartingId === svc.id;

            return (
              <div
                key={svc.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '200px 130px 1fr 80px',
                  padding: '10px 16px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: isOdd ? 'rgba(255,255,255,0.012)' : 'transparent',
                  alignItems: 'center',
                  fontSize: 12,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = isOdd ? 'rgba(255,255,255,0.012)' : 'transparent'; }}
              >
                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0,
                    boxShadow: svc.status === 'running' ? `0 0 5px ${color}` : 'none',
                  }} />
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {svc.name}
                  </span>
                  <span style={{
                    fontSize: 9, padding: '1px 5px', borderRadius: 3,
                    background: 'var(--layer-3)', color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {svc.kind}
                  </span>
                </div>

                {/* Status */}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color }}>
                  {svc.status || 'unknown'}
                </span>

                {/* Domain */}
                <div>
                  {domain ? (
                    <a
                      href={`https://${domain}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#94a3b8', textDecoration: 'none' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = '#94a3b8'; }}
                    >
                      {domain} ↗
                    </a>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>—</span>
                  )}
                </div>

                {/* Action */}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {isDown ? (
                    <button
                      onClick={() => handleRestart(svc.id)}
                      disabled={isBusy}
                      style={{
                        padding: '4px 10px', borderRadius: 5, fontSize: 11, fontFamily: 'var(--font-mono)',
                        background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                        color: '#f59e0b', cursor: isBusy ? 'not-allowed' : 'pointer',
                        opacity: isBusy ? 0.6 : 1,
                      }}
                    >
                      {isBusy ? '…' : 'Restart'}
                    </button>
                  ) : (
                    <a
                      href="https://coolify.automation-plus-ki.de"
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: '4px 10px', borderRadius: 5, fontSize: 11, fontFamily: 'var(--font-mono)',
                        background: 'transparent', border: '1px solid var(--border)',
                        color: 'var(--text-muted)', textDecoration: 'none',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-bright)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'; }}
                    >
                      Manage
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          <a
            href="https://coolify.automation-plus-ki.de"
            target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
          >
            Manage all in Coolify ↗
          </a>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
