'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface LogEntry {
  id: string;
  ts: string;
  level: 'info' | 'warn' | 'error' | 'critical';
  service: string;
  message: string;
  details?: string;
}

type LevelFilter = 'all' | 'info' | 'warn' | 'error' | 'critical';

const LEVEL_COLOR: Record<string, string> = {
  info:     '#94a3b8',
  warn:     '#f59e0b',
  error:    '#ef4444',
  critical: '#ef4444',
};

const LEVEL_BG: Record<string, string> = {
  info:     'rgba(148,163,184,0.08)',
  warn:     'rgba(245,158,11,0.08)',
  error:    'rgba(239,68,68,0.08)',
  critical: 'rgba(239,68,68,0.12)',
};

function formatTs(raw: string): string {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
           `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch { return raw; }
}

function timeAgo(raw: string): string {
  if (!raw) return '';
  try {
    const diff = Date.now() - new Date(raw).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  } catch { return ''; }
}

export default function LogsPage() {
  const [logs, setLogs]           = useState<LogEntry[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filter, setFilter]       = useState<LevelFilter>('all');
  const [search, setSearch]       = useState('');
  const [autoScroll, setAutoScroll] = useState(false);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<string>('');

  const bottomRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs/live');
      const data = await res.json();
      if (data.error && !data.logs?.length) {
        setError(data.error);
      } else {
        setError(null);
        setLogs(data.logs ?? []);
        setLastFetch(new Date().toISOString());
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (autoScroll) {
      intervalRef.current = setInterval(fetchLogs, 10_000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoScroll, fetchLogs]);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filtered = logs.filter(entry => {
    if (filter !== 'all' && entry.level !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return entry.message.toLowerCase().includes(q) || entry.service.toLowerCase().includes(q);
    }
    return true;
  });

  const counts: Record<LevelFilter, number> = {
    all:      logs.length,
    info:     logs.filter(l => l.level === 'info').length,
    warn:     logs.filter(l => l.level === 'warn').length,
    error:    logs.filter(l => l.level === 'error').length,
    critical: logs.filter(l => l.level === 'critical').length,
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Logs
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            NocoDB error_logs · {loading ? 'loading…' : `${logs.length} entries`}
            {lastFetch && (
              <span style={{ marginLeft: 10, color: 'var(--text-muted)' }}>
                · fetched {timeAgo(lastFetch)}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={fetchLogs}
          style={{
            padding: '6px 14px', borderRadius: 7, fontSize: 11, fontFamily: 'var(--font-mono)',
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer',
          }}
        >
          ↺ Refresh
        </button>
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
        padding: '8px 12px', background: 'var(--layer-2)', borderRadius: '8px 8px 0 0',
        border: '1px solid var(--border)', borderBottom: 'none',
      }}>
        {/* Level filter tabs */}
        <div style={{ display: 'flex', gap: 2 }}>
          {(['all', 'info', 'warn', 'error', 'critical'] as LevelFilter[]).map(lvl => {
            const active = filter === lvl;
            const color  = lvl === 'all' ? 'var(--text-secondary)' : (LEVEL_COLOR[lvl] ?? 'var(--text-secondary)');
            return (
              <button
                key={lvl}
                onClick={() => setFilter(lvl)}
                style={{
                  padding: '4px 10px', borderRadius: 5, fontSize: 11, fontFamily: 'var(--font-mono)',
                  fontWeight: active ? 600 : 400, cursor: 'pointer',
                  background: active ? (lvl === 'all' ? 'var(--layer-3)' : LEVEL_BG[lvl]) : 'transparent',
                  border: active ? `1px solid ${lvl === 'all' ? 'var(--border-bright)' : color + '40'}` : '1px solid transparent',
                  color: active ? color : 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {lvl}
                {counts[lvl] > 0 && (
                  <span style={{ marginLeft: 5, fontSize: 9, opacity: 0.7 }}>
                    {counts[lvl]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--layer-3)', border: '1px solid var(--border)', borderRadius: 6, padding: '0 10px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 12, marginRight: 6 }}>⌕</span>
          <input
            type="text"
            placeholder="Filter message or service…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)',
              padding: '5px 0',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13, padding: 0 }}>×</button>
          )}
        </div>

        {/* Auto-scroll toggle */}
        <button
          onClick={() => setAutoScroll(v => !v)}
          title={autoScroll ? 'Auto-scroll ON — click to disable' : 'Auto-scroll OFF — click to enable'}
          style={{
            padding: '4px 10px', borderRadius: 5, fontSize: 11, fontFamily: 'var(--font-mono)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            background: autoScroll ? 'rgba(52,211,153,0.1)' : 'var(--layer-3)',
            border: autoScroll ? '1px solid rgba(52,211,153,0.35)' : '1px solid var(--border)',
            color: autoScroll ? '#34d399' : 'var(--text-muted)',
          }}
        >
          <span style={{ fontSize: 9, lineHeight: 1, opacity: autoScroll ? 1 : 0.5 }}>●</span>
          Auto
        </button>

        {/* Count indicator */}
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filtered.length}/{logs.length}
        </span>
      </div>

      {/* Log console */}
      <div style={{
        background: 'var(--layer-1)', border: '1px solid var(--border)',
        borderRadius: '0 0 8px 8px', height: 'calc(100vh - 220px)',
        overflowY: 'auto', fontFamily: 'var(--font-mono)',
      }}>

        {loading && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            Loading logs…
          </div>
        )}

        {error && !loading && (
          <div style={{
            margin: '16px 16px 0', padding: '10px 14px', borderRadius: 6, fontSize: 12,
            background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444',
          }}>
            {error}
          </div>
        )}

        {!loading && filtered.length === 0 && !error && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
            No log entries match the current filter.
          </div>
        )}

        {filtered.map((entry, idx) => {
          const isExpanded = expanded === entry.id;
          const color      = LEVEL_COLOR[entry.level] ?? '#94a3b8';
          const isCritical = entry.level === 'critical';
          const isOdd      = idx % 2 === 1;

          return (
            <div
              key={entry.id}
              onClick={() => entry.details ? setExpanded(isExpanded ? null : entry.id) : undefined}
              style={{
                padding: '5px 14px',
                background: isExpanded
                  ? LEVEL_BG[entry.level]
                  : isOdd
                    ? 'rgba(255,255,255,0.012)'
                    : 'transparent',
                cursor: entry.details ? 'pointer' : 'default',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = isOdd ? 'rgba(255,255,255,0.012)' : 'transparent'; }}
            >
              {/* Main log line */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, fontSize: 12, lineHeight: '20px' }}>
                {/* Timestamp */}
                <span style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', width: 160, flexShrink: 0 }}>
                  {formatTs(entry.ts)}
                </span>

                {/* Level badge */}
                <span style={{
                  color,
                  fontWeight: isCritical ? 700 : 500,
                  width: 68, flexShrink: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontSize: isCritical ? 11 : 11,
                }}>
                  {entry.level}
                </span>

                {/* Service */}
                <span style={{ color: 'var(--text-secondary)', width: 120, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {entry.service}
                </span>

                {/* Message */}
                <span style={{
                  color: isCritical ? '#fca5a5' : 'var(--text-primary)',
                  fontWeight: isCritical ? 600 : 400,
                  flex: 1,
                  whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap',
                  overflow: isExpanded ? 'visible' : 'hidden',
                  textOverflow: isExpanded ? 'clip' : 'ellipsis',
                }}>
                  {entry.message}
                </span>

                {/* Expand indicator */}
                {entry.details && (
                  <span style={{ color: 'var(--text-muted)', fontSize: 10, marginLeft: 8, flexShrink: 0 }}>
                    {isExpanded ? '▲' : '▼'}
                  </span>
                )}
              </div>

              {/* Expanded details */}
              {isExpanded && entry.details && (
                <div style={{
                  marginTop: 6, marginLeft: 160 + 68 + 120,
                  padding: '8px 12px', borderRadius: 5,
                  background: 'rgba(0,0,0,0.3)', border: `1px solid ${color}25`,
                  fontSize: 11, color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                  maxHeight: 260, overflowY: 'auto',
                }}>
                  {entry.details}
                </div>
              )}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {/* Footer bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: 8, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
      }}>
        <span>
          {counts.error > 0 && (
            <span style={{ color: '#ef4444', marginRight: 12 }}>
              ● {counts.error} error{counts.error !== 1 ? 's' : ''}
            </span>
          )}
          {counts.warn > 0 && (
            <span style={{ color: '#f59e0b', marginRight: 12 }}>
              ● {counts.warn} warning{counts.warn !== 1 ? 's' : ''}
            </span>
          )}
          {counts.critical > 0 && (
            <span style={{ color: '#ef4444', fontWeight: 700 }}>
              ● {counts.critical} critical
            </span>
          )}
        </span>
        <span>
          {autoScroll ? 'auto-scroll on · polling every 10s' : 'auto-scroll off'}
        </span>
      </div>
    </div>
  );
}
