'use client';

import { useEffect, useState, useCallback } from 'react';
import { ExternalLink, Zap, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';

interface Workflow {
  Id?: number;
  id?: string | number;
  title?: string;
  Title?: string;
  name?: string;
  trigger_type?: string;
  status?: string;
  last_run?: string;
  lastRun?: string;
  [key: string]: unknown;
}

function statusBadge(status: string | undefined) {
  switch ((status ?? '').toLowerCase()) {
    case 'active':
    case 'aktiv':
      return { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', label: 'Aktiv' };
    case 'inactive':
    case 'inaktiv':
      return { bg: 'rgba(100,116,139,0.15)', color: '#94a3b8', label: 'Inaktiv' };
    default:
      return { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: status ?? '—' };
  }
}

function formatTs(ts: string | undefined): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return ts; }
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Workflow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/nocodb/workflows');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: Workflow[] = Array.isArray(data) ? data : (data.list ?? []);
      setWorkflows(list);
      if (list.length > 0 && !selected) setSelected(list[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const activeCount = workflows.filter(w => ['active','aktiv'].includes(String(w.status ?? '').toLowerCase())).length;
  const lastTriggered = workflows.reduce<string | undefined>((acc, w) => {
    const t = (w.last_run ?? w.lastRun) as string | undefined;
    if (!t) return acc;
    return !acc || t > acc ? t : acc;
  }, undefined);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 52px)', fontFamily: 'var(--font-ui, inherit)' }}>

      {/* LEFT: Workflow list */}
      <div style={{
        width: '60%', borderRight: '1px solid var(--border, #2d3748)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid var(--border, #2d3748)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={16} color="var(--accent-amber, #f59e0b)" />
            <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary, #f1f5f9)' }}>Workflows</span>
            {!loading && (
              <span style={{
                fontSize: 11, padding: '1px 7px', borderRadius: 20,
                background: 'var(--layer-3, #2a3347)',
                color: 'var(--text-secondary, #94a3b8)',
              }}>{workflows.length}</span>
            )}
          </div>
          <button
            onClick={load}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7, fontSize: 12,
              background: 'var(--layer-2, #1e2535)',
              border: '1px solid var(--border, #2d3748)',
              color: 'var(--text-secondary, #94a3b8)', cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} />
            Aktualisieren
          </button>
        </div>

        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px',
          padding: '8px 20px', borderBottom: '1px solid var(--border, #2d3748)',
          flexShrink: 0,
        }}>
          {['Name', 'Trigger', 'Status', 'Letzter Run'].map(h => (
            <span key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary, #64748b)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</span>
          ))}
        </div>

        {/* List */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ padding: '12px 20px', borderBottom: '1px solid var(--border, #2d3748)', display: 'flex', gap: 12 }}>
                {[200, 80, 60, 70].map((w, j) => (
                  <div key={j} style={{ height: 12, width: w, borderRadius: 4, background: 'var(--layer-3, #2a3347)' }} />
                ))}
              </div>
            ))
          ) : error ? (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <AlertTriangle size={20} color="#f59e0b" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>{error}</p>
            </div>
          ) : workflows.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <Zap size={28} style={{ margin: '0 auto 12px', opacity: 0.3, color: 'var(--text-secondary)' }} />
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>Keine Workflows gefunden.</p>
            </div>
          ) : (
            workflows.map((w, i) => {
              const title = (w.title ?? w.Title ?? w.name ?? `Workflow ${i + 1}`) as string;
              const trigger = (w.trigger_type ?? w.trigger ?? '—') as string;
              const isSelected = selected?.Id === w.Id && selected?.id === w.id;
              const badge = statusBadge(w.status as string);
              return (
                <div
                  key={w.id ?? w.Id ?? i}
                  onClick={() => setSelected(w)}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 120px 100px 100px',
                    alignItems: 'center',
                    padding: '10px 20px',
                    borderBottom: '1px solid var(--border, #2d3748)',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(59,130,246,0.08)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--accent-blue, #3b82f6)' : '2px solid transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary, #f1f5f9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', fontFamily: 'var(--font-mono, monospace)' }}>{trigger}</span>
                  <span style={{ display: 'inline-flex' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: badge.bg, color: badge.color }}>{badge.label}</span>
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary, #64748b)', fontFamily: 'var(--font-mono, monospace)' }}>
                    {formatTs((w.last_run ?? w.lastRun) as string)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Quick links */}
      <div style={{
        width: '40%', padding: '20px 24px',
        overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        {/* n8n button */}
        <a
          href="https://n8n.automation-plus-ki.de"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px 20px', borderRadius: 10,
            background: 'var(--accent-amber, #f59e0b)',
            color: '#000', fontWeight: 700, fontSize: 15,
            textDecoration: 'none', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Zap size={18} />
          Öffne n8n Editor
          <ExternalLink size={14} />
        </a>

        {/* Stats */}
        <div style={{
          background: 'var(--layer-2, #1e2535)',
          border: '1px solid var(--border, #2d3748)',
          borderRadius: 10, padding: '16px 18px',
        }}>
          <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Statistiken</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Workflows gesamt', value: loading ? '…' : workflows.length },
              { label: 'Aktiv', value: loading ? '…' : activeCount, color: '#22c55e' },
              { label: 'Letzter Trigger', value: loading ? '…' : formatTs(lastTriggered) },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: s.color ?? 'var(--text-primary, #f1f5f9)' }}>{String(s.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected workflow detail */}
        {selected && !loading && (
          <div style={{
            background: 'var(--layer-2, #1e2535)',
            border: '1px solid var(--border, #2d3748)',
            borderRadius: 10, padding: '16px 18px',
          }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ausgewählt</p>
            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>
              {(selected.title ?? selected.Title ?? selected.name ?? '—') as string}
            </p>
            {Object.entries(selected)
              .filter(([k]) => !['Id','id'].includes(k))
              .slice(0, 6)
              .map(([k, v]) => (
                <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary, #64748b)', fontFamily: 'var(--font-mono, monospace)', minWidth: 110 }}>{k}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(v ?? '—')}</span>
                </div>
              ))
            }
          </div>
        )}

        {/* n8n Webhook URLs */}
        <div style={{
          background: 'var(--layer-2, #1e2535)',
          border: '1px solid var(--border, #2d3748)',
          borderRadius: 10, padding: '16px 18px',
        }}>
          <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>n8n Webhook URLs</p>
          <div style={{
            background: 'var(--layer-3, #0f1624)',
            borderRadius: 6, padding: '10px 12px',
            fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
            color: 'var(--text-secondary, #64748b)',
          }}>
            <p style={{ margin: '0 0 4px', color: '#3b82f6' }}>POST https://n8n.automation-plus-ki.de/webhook/&lt;id&gt;</p>
            <p style={{ margin: '0 0 4px' }}>GET  https://n8n.automation-plus-ki.de/webhook-test/&lt;id&gt;</p>
            <p style={{ margin: 0, color: '#64748b' }}># Konfiguriere Webhooks im n8n Editor</p>
          </div>
          <a
            href="https://n8n.automation-plus-ki.de"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              marginTop: 10, fontSize: 12,
              color: 'var(--accent-blue, #3b82f6)', textDecoration: 'none',
            }}
          >
            n8n öffnen <ChevronRight size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}
