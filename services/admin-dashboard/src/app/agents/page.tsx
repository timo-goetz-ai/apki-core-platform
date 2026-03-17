'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bot, Plus, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

interface Agent {
  Id?: number;
  id?: string | number;
  name?: string;
  status?: string;
  description?: string;
  last_run?: string;
  [key: string]: unknown;
}

function statusColor(status: string | undefined): { bg: string; text: string; label: string } {
  switch ((status ?? '').toLowerCase()) {
    case 'active':
    case 'aktiv':
      return { bg: 'rgba(34,197,94,0.12)', text: 'var(--accent-green, #22c55e)', label: 'Aktiv' };
    case 'paused':
    case 'pausiert':
      return { bg: 'rgba(245,158,11,0.12)', text: 'var(--accent-amber, #f59e0b)', label: 'Pausiert' };
    default:
      return { bg: 'rgba(100,116,139,0.15)', text: 'var(--text-secondary, #94a3b8)', label: 'Entwurf' };
  }
}

function formatTs(ts: string | undefined): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts;
  }
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--layer-2, #1e2535)',
      border: '1px solid var(--border, #2d3748)',
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {[120, 80, 60, 40].map((w, i) => (
        <div key={i} style={{
          height: i === 0 ? 16 : 12,
          width: w,
          borderRadius: 6,
          background: 'var(--layer-3, #2a3347)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}

function AgentCard({ agent }: { agent: Agent }) {
  const name = (agent.name ?? agent.Name ?? String(agent.id ?? agent.Id ?? '—')) as string;
  const status = (agent.status ?? agent.Status ?? 'draft') as string;
  const description = (agent.description ?? agent.Description ?? agent.beschreibung ?? '') as string;
  const lastRun = (agent.last_run ?? agent.lastRun ?? agent.last_run_at ?? '') as string;
  const badge = statusColor(status);

  return (
    <div style={{
      background: 'var(--layer-2, #1e2535)',
      border: '1px solid var(--border, #2d3748)',
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-blue, #3b82f6)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border, #2d3748)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--layer-3, #2a3347)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bot size={16} color="var(--accent-blue, #3b82f6)" />
          </div>
          <span style={{
            fontFamily: 'var(--font-ui, inherit)',
            fontWeight: 600,
            fontSize: 14,
            color: 'var(--text-primary, #f1f5f9)',
          }}>{name}</span>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center',
          padding: '2px 8px', borderRadius: 20,
          fontSize: 11, fontWeight: 600,
          background: badge.bg,
          color: badge.text,
          flexShrink: 0,
        }}>{badge.label}</span>
      </div>

      {description ? (
        <p style={{
          margin: 0,
          fontSize: 13,
          color: 'var(--text-secondary, #94a3b8)',
          lineHeight: 1.5,
        }}>{String(description)}</p>
      ) : null}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
        <Clock size={11} color="var(--text-secondary, #64748b)" />
        <span style={{ fontSize: 11, color: 'var(--text-secondary, #64748b)', fontFamily: 'var(--font-mono, monospace)' }}>
          {formatTs(lastRun)}
        </span>
      </div>
    </div>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/nocodb/agents');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : (data.list ?? []));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function showToast() {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  }

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', fontFamily: 'var(--font-ui, inherit)' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 9999,
          background: 'var(--layer-3, #2a3347)',
          border: '1px solid var(--border, #2d3748)',
          borderRadius: 10, padding: '10px 16px',
          fontSize: 13, color: 'var(--text-primary, #f1f5f9)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          Neuer Agent — Coming Soon
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bot size={22} color="var(--accent-blue, #3b82f6)" />
            Agenten-Fabrik
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>
            Verwaltung und Orchestrierung von KI-Agenten
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={load}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 8, fontSize: 13,
              background: 'var(--layer-2, #1e2535)',
              border: '1px solid var(--border, #2d3748)',
              color: 'var(--text-secondary, #94a3b8)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Aktualisieren
          </button>
          <button
            onClick={showToast}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--accent-blue, #3b82f6)',
              border: 'none', color: '#fff', cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            Neuer Agent
          </button>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div style={{
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 12, padding: '24px 28px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 480,
        }}>
          <AlertTriangle size={24} color="#ef4444" />
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>Fehler beim Laden der Agenten</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>{error}</p>
          </div>
          <button
            onClick={load}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13,
              background: 'var(--layer-2, #1e2535)',
              border: '1px solid var(--border, #2d3748)',
              color: 'var(--text-primary, #f1f5f9)', cursor: 'pointer',
            }}
          >
            Erneut versuchen
          </button>
        </div>
      ) : (
        <>
          {/* Stats bar */}
          {!loading && agents.length > 0 && (
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              {[
                { label: 'Gesamt', value: agents.length, color: 'var(--text-primary, #f1f5f9)' },
                { label: 'Aktiv', value: agents.filter(a => ['active','aktiv'].includes(String(a.status ?? '').toLowerCase())).length, color: 'var(--accent-green, #22c55e)' },
                { label: 'Pausiert', value: agents.filter(a => ['paused','pausiert'].includes(String(a.status ?? '').toLowerCase())).length, color: 'var(--accent-amber, #f59e0b)' },
              ].map(s => (
                <div key={s.label} style={{
                  background: 'var(--layer-2, #1e2535)',
                  border: '1px solid var(--border, #2d3748)',
                  borderRadius: 8, padding: '8px 16px',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : agents.length === 0
                ? (
                  <div style={{
                    gridColumn: '1 / -1',
                    background: 'var(--layer-2, #1e2535)',
                    border: '1px solid var(--border, #2d3748)',
                    borderRadius: 12, padding: '40px 24px',
                    textAlign: 'center', color: 'var(--text-secondary, #94a3b8)',
                  }}>
                    <Bot size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontSize: 14 }}>Keine Agenten gefunden. Erstelle deinen ersten Agenten in NocoDB.</p>
                  </div>
                )
                : agents.map((a, i) => <AgentCard key={a.id ?? a.Id ?? i} agent={a} />)
            }
          </div>
        </>
      )}
    </div>
  );
}
