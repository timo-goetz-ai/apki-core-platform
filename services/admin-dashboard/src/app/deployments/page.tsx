'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Rocket, RefreshCw, ExternalLink, Globe, Clock,
  Play, Square, RotateCcw, Server, Container, AlertCircle,
} from 'lucide-react';

interface CoolifyService {
  id: string; name: string; kind: string; status: string;
  fqdn: string | null; repo: string | null; updatedAt: string | null;
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'gerade eben';
  if (m < 60) return `vor ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h}h`;
  return `vor ${Math.floor(h / 24)}d`;
}

function statusColor(s: string) {
  if (s === 'running')                    return '#34d399';
  if (s === 'stopped' || s === 'exited') return '#f87171';
  if (s === 'starting' || s === 'restarting') return '#fbbf24';
  return '#475569';
}

function statusLabel(s: string) {
  if (s === 'running')    return 'running';
  if (s === 'stopped')    return 'stopped';
  if (s === 'exited')     return 'exited';
  if (s === 'starting')   return 'starting';
  if (s === 'restarting') return 'restarting';
  return s || 'unknown';
}

export default function DeploymentsPage() {
  const [services, setServices]   = useState<CoolifyService[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/coolify/services');
      const data = await res.json();
      if (data.error && !data.services?.length) setError(data.error);
      else setServices(data.services ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
      setTimeout(() => setRefreshing(false), 600);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const runAction = async (id: string, action: 'deploy' | 'restart' | 'stop') => {
    setActionId(`${id}-${action}`);
    try {
      await fetch('/api/coolify/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid: id, action }),
      });
      setTimeout(load, 2000);
    } catch { /* silent */ }
    finally { setTimeout(() => setActionId(null), 2000); }
  };

  const running  = services.filter(s => s.status === 'running').length;
  const stopped  = services.filter(s => s.status === 'stopped' || s.status === 'exited').length;
  const apps     = services.filter(s => s.kind === 'app');
  const svcs     = services.filter(s => s.kind === 'service');

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Rocket size={20} style={{ color: '#38bdf8' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Deployments</h1>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Coolify · Hetzner CPX42</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
            background: 'var(--layer-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
            cursor: 'pointer', fontSize: 12,
          }}>
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            Refresh
          </button>
          <a
            href="https://coolify.automation-plus-ki.de"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
              background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
              color: '#34d399', fontSize: 12, fontWeight: 600, textDecoration: 'none',
            }}
          >
            In Coolify öffnen <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Gesamt',    value: services.length, color: 'var(--text-primary)', icon: <Server size={14} /> },
          { label: 'Running',   value: running,          color: '#34d399',            icon: <Play size={14} /> },
          { label: 'Stopped',   value: stopped,          color: '#f87171',            icon: <Square size={14} /> },
          { label: 'Apps',      value: apps.length,      color: '#38bdf8',            icon: <Container size={14} /> },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 12,
            padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ color: stat.color, opacity: 0.8 }}>{stat.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: stat.color, lineHeight: 1 }}>
                {loading ? '…' : stat.value}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 8, marginBottom: 20,
          background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171', fontSize: 12,
        }}>
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Apps section */}
      {apps.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Applications · {apps.length}
          </p>
          <motion.div
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}
          >
            {apps.map(svc => (
              <ServiceCard key={svc.id} svc={svc} actionId={actionId} onAction={runAction} />
            ))}
          </motion.div>
        </div>
      )}

      {/* Services section */}
      {svcs.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Services · {svcs.length}
          </p>
          <motion.div
            initial="hidden" animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}
          >
            {svcs.map(svc => (
              <ServiceCard key={svc.id} svc={svc} actionId={actionId} onAction={runAction} />
            ))}
          </motion.div>
        </div>
      )}

      {!loading && services.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
          Keine Deployments gefunden. Coolify API prüfen.
        </div>
      )}
    </div>
  );
}

function ServiceCard({ svc, actionId, onAction }: {
  svc: CoolifyService;
  actionId: string | null;
  onAction: (id: string, action: 'deploy' | 'restart' | 'stop') => void;
}) {
  const color = statusColor(svc.status);
  const isRunning = svc.status === 'running';
  const isBusy = actionId?.startsWith(svc.id) ?? false;
  const domain = svc.fqdn ? svc.fqdn.replace(/^https?:\/\//, '').split('/')[0] : null;

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
      style={{
        background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 12,
        padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12,
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Top accent */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />

      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5,
          boxShadow: isRunning ? `0 0 6px ${color}` : 'none',
          animation: isRunning ? 'status-pulse 2.5s ease-in-out infinite' : 'none',
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{svc.name}</p>
          {domain && (
            <a href={`https://${domain}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 3, fontSize: 10, color: '#38bdf8', textDecoration: 'none' }}
            >
              <Globe size={9} />
              {domain}
            </a>
          )}
        </div>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, color, background: color + '18', border: `1px solid ${color}30`, fontFamily: 'var(--font-mono)' }}>
            {statusLabel(svc.status)}
          </span>
          <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 5, color: 'var(--text-muted)', background: 'var(--layer-3)', fontFamily: 'var(--font-mono)' }}>
            {svc.kind}
          </span>
        </div>
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        {svc.repo && (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
            {svc.repo.replace('https://github.com/', '')}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto' }}>
          <Clock size={9} />
          {timeAgo(svc.updatedAt)}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6 }}>
        <ActionBtn
          label="Deploy" icon={<Rocket size={11} />} color="#38bdf8"
          disabled={isBusy} onClick={() => onAction(svc.id, 'deploy')}
        />
        <ActionBtn
          label="Restart" icon={<RotateCcw size={11} />} color="#fbbf24"
          disabled={isBusy} onClick={() => onAction(svc.id, 'restart')}
        />
        {svc.fqdn && (
          <a
            href={`https://${domain}`} target="_blank" rel="noopener noreferrer"
            style={{
              marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4,
              padding: '5px 10px', borderRadius: 7, fontSize: 11,
              background: 'transparent', border: '1px solid var(--border)',
              color: 'var(--text-muted)', textDecoration: 'none', transition: 'all 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'); (e.currentTarget.style.color = '#38bdf8'); }}
            onMouseLeave={e => { (e.currentTarget.style.borderColor = 'var(--border)'); (e.currentTarget.style.color = 'var(--text-muted)'); }}
          >
            <ExternalLink size={10} /> Öffnen
          </a>
        )}
      </div>
    </motion.div>
  );
}

function ActionBtn({ label, icon, color, disabled, onClick }: {
  label: string; icon: React.ReactNode; color: string; disabled: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 500,
        background: color + '10', border: `1px solid ${color}30`,
        color, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1, transition: 'all 0.12s',
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = color + '20'; e.currentTarget.style.borderColor = color + '50'; } }}
      onMouseLeave={e => { e.currentTarget.style.background = color + '10'; e.currentTarget.style.borderColor = color + '30'; }}
    >
      {icon} {label}
    </button>
  );
}
