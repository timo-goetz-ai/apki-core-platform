'use client';

import { useCallback, useEffect, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────── */

interface JarvisTask {
  id: number;
  source: string | null;
  intent: string | null;
  mcp_server: string | null;
  status: string;
  tg_chat_id: string | null;
  created_at: string | null;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'executing' | 'completed' | 'failed' | 'aborted';

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

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pending:   { bg: 'rgba(245,158,11,0.15)',  color: 'var(--accent-amber, var(--accent-amber))',  label: 'pending'   },
  approved:  { bg: 'rgba(59,130,246,0.15)',  color: 'var(--accent-blue, var(--accent-blue))',   label: 'approved'  },
  executing: { bg: 'color-mix(in srgb, var(--accent-blue) 15%, transparent)',   color: 'var(--accent-blue)',                        label: 'executing' },
  completed: { bg: 'rgba(52,211,153,0.15)',  color: 'var(--accent-green, var(--accent-green))',  label: 'completed' },
  failed:    { bg: 'rgba(239,68,68,0.15)',   color: 'var(--accent-red, var(--accent-red))',    label: 'failed'    },
  aborted:   { bg: 'rgba(148,163,184,0.15)', color: 'var(--text-muted, var(--text-secondary))',    label: 'aborted'   },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.aborted;
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      border: `1px solid ${s.color}40`,
      borderRadius: 4,
      padding: '2px 8px',
      fontSize: 11,
      fontFamily: 'var(--font-mono)',
      letterSpacing: '0.03em',
      textTransform: 'uppercase',
    }}>
      {s.label}
    </span>
  );
}

const FILTERS: StatusFilter[] = ['all', 'pending', 'approved', 'executing', 'completed', 'failed', 'aborted'];

/* ─── Page ───────────────────────────────────────────────────────── */

export default function JarvisPage() {
  const [tasks, setTasks]       = useState<JarvisTask[]>([]);
  const [filter, setFilter]     = useState<StatusFilter>('all');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await fetch(`/api/jarvis/tasks${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: JarvisTask[] = await res.json();
      setTasks(data);
      setError(null);
      setLastRefresh(new Date());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(fetchTasks, 30_000);
    return () => clearInterval(id);
  }, [fetchTasks]);

  const counts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ padding: '24px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            🤖 Jarvis Tasks
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
            HITL Approval Queue — Intent → Plan → Execute
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {lastRefresh && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              aktualisiert {timeAgo(lastRefresh.toISOString())}
            </span>
          )}
          <button
            onClick={fetchTasks}
            style={{
              background: 'var(--layer-2)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '6px 12px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Status Summary */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        {Object.entries(STATUS_STYLE).map(([status, style]) => (
          <div key={status} style={{
            background: 'var(--layer-1)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '8px 14px',
            minWidth: 90,
          }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {style.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color: style.color, fontFamily: 'var(--font-mono)' }}>
              {counts[status] ?? 0}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              background: filter === f ? 'var(--accent-blue)' : 'var(--layer-1)',
              border: `1px solid ${filter === f ? 'var(--accent-blue)' : 'var(--border)'}`,
              borderRadius: 6,
              padding: '4px 12px',
              color: filter === f ? 'white' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid var(--accent-red)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
          color: 'var(--accent-red)',
          fontSize: 13,
        }}>
          ⚠️ Nexus Core nicht erreichbar: {error}
        </div>
      )}

      {/* Table */}
      <div style={{
        background: 'var(--layer-1)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--layer-2)' }}>
              {['ID', 'Status', 'Intent', 'MCP Server', 'Source', 'Erstellt'].map(h => (
                <th key={h} style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: 600,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  ⏳ Lade Tasks…
                </td>
              </tr>
            )}
            {!loading && tasks.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                  Keine Jarvis Tasks gefunden.
                </td>
              </tr>
            )}
            {tasks.map((task, i) => (
              <tr key={task.id} style={{
                borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
              }}>
                <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
                  #{task.id}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <StatusBadge status={task.status} />
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-primary)', maxWidth: 380 }}>
                  <span title={task.intent ?? ''} style={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {task.intent ?? '—'}
                  </span>
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--accent-blue, var(--accent-blue))' }}>
                  {task.mcp_server ?? '—'}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                  {task.source ?? '—'}
                </td>
                <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {timeAgo(task.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12, fontFamily: 'var(--font-mono)' }}>
        {tasks.length} Task{tasks.length !== 1 ? 's' : ''} — Auto-Refresh alle 30s
      </p>
    </div>
  );
}
