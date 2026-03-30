'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Status colors (only these, per design rules) ──────────────────────────────
const C = {
  success: 'var(--accent-green)',
  warning: 'var(--accent-amber)',
  error:   'var(--accent-red)',
  unknown: 'var(--text-secondary)',
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────
type FilterKey = 'all' | 'n8n' | 'content' | 'errors';

interface LiveEvent {
  id:    string;
  icon:  string;
  text:  string;
  sub:   string;
  ts:    number;
  color: string;
  type:  string;
  ok:    boolean;
}

interface GroupedEntry {
  dateLabel: string;
  entries: LiveEvent[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtTimestamp(ts: number): string {
  return new Date(ts).toLocaleTimeString('de-DE', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function fmtDateLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return `Heute, ${d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `Gestern, ${d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  }
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getDateKey(ts: number): string {
  return new Date(ts).toDateString();
}

function groupByDate(events: LiveEvent[]): GroupedEntry[] {
  const groups: Record<string, LiveEvent[]> = {};
  const order: string[] = [];
  for (const e of events) {
    const key = getDateKey(e.ts);
    if (!groups[key]) { groups[key] = []; order.push(key); }
    groups[key].push(e);
  }
  return order.map(key => ({
    dateLabel: fmtDateLabel(groups[key][0].ts),
    entries: groups[key],
  }));
}

function sourceLabel(type: string): string {
  if (type.startsWith('n8n'))    return 'n8n';
  if (type === 'content')        return 'content';
  if (type === 'prometheus-alert') return 'alert';
  if (type === 'scanner')        return 'scanner';
  return type.replace(/-/g, ' ');
}

function statusColor(ok: boolean, color: string): string {
  if (color === 'var(--accent-green)') return C.success;
  if (color === 'var(--accent-red)' || color === 'var(--accent-red)' || color === 'var(--accent-red)') return C.error;
  if (color === 'var(--accent-amber)' || color === 'var(--accent-amber)') return C.warning;
  return ok ? C.success : C.error;
}

function exportCsv(events: LiveEvent[]) {
  const header = 'Timestamp,Type,Text,Sub,Status';
  const rows = events.map(e =>
    `"${new Date(e.ts).toISOString()}","${e.type}","${e.text.replace(/"/g, '""')}","${e.sub}","${e.ok ? 'success' : 'error'}"`
  );
  const blob = new Blob([header + '\n' + rows.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `activity-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ── Filter tab button ─────────────────────────────────────────────────────────
function FilterTab({ label, active, count, onClick }: {
  label: string; active: boolean; count: number; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: 5,
        border: active ? '1px solid rgba(148,163,184,0.35)' : '1px solid transparent',
        background: active ? 'var(--layer-2, var(--layer-2))' : 'transparent',
        color: active ? 'var(--text-primary, var(--text-primary))' : 'var(--text-secondary, var(--text-secondary))',
        fontSize: 12,
        fontWeight: active ? 600 : 400,
        fontFamily: 'var(--font-ui)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary, var(--text-primary))'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary, var(--text-secondary))'; }}
    >
      {label}
      <span style={{
        fontSize: 10,
        fontFamily: 'var(--font-mono)',
        padding: '1px 5px',
        borderRadius: 3,
        background: active ? 'var(--layer-3, var(--layer-3))' : 'rgba(148,163,184,0.08)',
        color: active ? 'var(--text-secondary)' : 'var(--text-muted, var(--text-muted))',
        minWidth: 18,
        textAlign: 'center',
      }}>
        {count}
      </span>
    </button>
  );
}

// ── Activity row ──────────────────────────────────────────────────────────────
function ActivityRow({ event, isLast }: { event: LiveEvent; isLast: boolean }) {
  const [hovered, setHovered] = useState(false);
  const col = statusColor(event.ok, event.color);
  const src = sourceLabel(event.type);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '88px 72px 1fr 80px',
        alignItems: 'center',
        gap: 0,
        padding: '9px 16px',
        borderBottom: isLast ? 'none' : '1px solid var(--border, var(--layer-3))',
        background: hovered ? 'var(--layer-1, var(--layer-1))' : 'transparent',
        transition: 'background 0.1s',
        cursor: 'default',
      }}
    >
      {/* Timestamp */}
      <span style={{
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted, var(--text-muted))',
        userSelect: 'none',
      }}>
        {fmtTimestamp(event.ts)}
      </span>

      {/* Source badge */}
      <div>
        <span style={{
          display: 'inline-block',
          padding: '2px 7px',
          borderRadius: 4,
          background: 'var(--layer-3, var(--layer-3))',
          border: '1px solid var(--border, var(--layer-3))',
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary, var(--text-secondary))',
          whiteSpace: 'nowrap',
        }}>
          {src}
        </span>
      </div>

      {/* Description */}
      <div style={{ overflow: 'hidden', paddingRight: 12 }}>
        <div style={{
          fontSize: 12,
          color: 'var(--text-primary, var(--text-primary))',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {event.text}
        </div>
        {event.sub && (
          <div style={{
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted, var(--text-muted))',
            marginTop: 1,
          }}>
            {event.sub}
          </div>
        )}
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: col, flexShrink: 0,
        }} />
        <span style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          color: col,
        }}>
          {event.ok ? 'success' : 'error'}
        </span>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ActivityPage() {
  const [events,      setEvents]      = useState<LiveEvent[]>([]);
  const [filter,      setFilter]      = useState<FilterKey>('all');
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [spinning,    setSpinning]    = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchActivity = useCallback(async () => {
    setSpinning(true);
    setError(null);
    try {
      const res = await fetch('/api/activity/live', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json() as { events: LiveEvent[] };
      setEvents(d.events ?? []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      setSpinning(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const iv = setInterval(fetchActivity, 30000);
    return () => clearInterval(iv);
  }, [fetchActivity]);

  // ── Filter + search ────────────────────────────────────────────────────────
  const filtered = events.filter(e => {
    if (filter === 'n8n'     && !e.type.startsWith('n8n'))      return false;
    if (filter === 'content' && e.type !== 'content')            return false;
    if (filter === 'errors'  && e.ok)                            return false;
    if (search) {
      const q = search.toLowerCase();
      if (!e.text.toLowerCase().includes(q) && !e.sub.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const countFor = (k: FilterKey) => {
    if (k === 'all')     return events.length;
    if (k === 'n8n')     return events.filter(e => e.type.startsWith('n8n')).length;
    if (k === 'content') return events.filter(e => e.type === 'content').length;
    if (k === 'errors')  return events.filter(e => !e.ok).length;
    return 0;
  };

  const grouped = groupByDate(filtered);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const successCount = events.filter(e => e.ok).length;
  const errorCount   = events.filter(e => !e.ok).length;
  const successRate  = events.length ? Math.round((successCount / events.length) * 100) : 100;

  return (
    <div style={{
      padding: '24px 28px 48px',
      background: 'var(--layer-0, var(--layer-0))',
      minHeight: '100vh',
      fontFamily: 'var(--font-ui, system-ui)',
      color: 'var(--text-primary, var(--text-primary))',
    }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Activity Log
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted, var(--text-muted))' }}>
            {lastUpdated
              ? `Updated ${lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
              : 'Loading…'}
            {' · '}{events.length} events
          </p>
        </div>
        <button
          onClick={() => exportCsv(filtered)}
          disabled={filtered.length === 0}
          style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 12,
            background: 'var(--layer-2, var(--layer-2))',
            border: '1px solid var(--border, var(--layer-3))',
            color: 'var(--text-secondary, var(--text-secondary))',
            cursor: filtered.length === 0 ? 'default' : 'pointer',
            opacity: filtered.length === 0 ? 0.4 : 1,
            fontFamily: 'var(--font-ui)',
            transition: 'opacity 0.1s',
          }}
          onMouseEnter={e => { if (filtered.length > 0) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary, var(--text-secondary))'; }}
        >
          Export CSV
        </button>
      </div>

      {/* ── Stats strip ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 8,
        marginBottom: 20,
      }}>
        {[
          { label: 'Total Events',  value: events.length,   color: 'var(--text-primary)' },
          { label: 'Success',       value: successCount,    color: C.success              },
          { label: 'Errors',        value: errorCount,      color: errorCount > 0 ? C.error : 'var(--text-muted)' },
          { label: 'Success Rate',  value: `${successRate}%`, color: successRate >= 90 ? C.success : successRate >= 70 ? C.warning : C.error },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--layer-2, var(--layer-2))',
            border: '1px solid var(--border, var(--layer-3))',
            borderRadius: 8,
            padding: '12px 16px',
          }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 6 }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: stat.color }}>
              {loading ? '…' : stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Toolbar: filters + search ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'n8n', 'content', 'errors'] as FilterKey[]).map(k => (
            <FilterTab
              key={k}
              label={k.charAt(0).toUpperCase() + k.slice(1)}
              active={filter === k}
              count={countFor(k)}
              onClick={() => setFilter(k)}
            />
          ))}
        </div>

        <div style={{ flex: 1, minWidth: 180, maxWidth: 280, marginLeft: 'auto' }}>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '5px 10px',
              borderRadius: 6,
              border: '1px solid var(--border, var(--layer-3))',
              background: 'var(--layer-2, var(--layer-2))',
              color: 'var(--text-primary, var(--text-primary))',
              fontSize: 12,
              fontFamily: 'var(--font-ui)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = 'var(--border-bright, var(--layer-3))'}
            onBlur={e  => (e.target as HTMLInputElement).style.borderColor = 'var(--border, var(--layer-3))'}
          />
        </div>

        {spinning && (
          <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            refreshing…
          </span>
        )}
      </div>

      {/* ── Error state ── */}
      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 8,
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.25)',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.error, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: C.error }}>{error}</span>
          <button
            onClick={fetchActivity}
            style={{
              marginLeft: 'auto', padding: '3px 10px', borderRadius: 5, fontSize: 11,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: C.error, cursor: 'pointer', fontFamily: 'var(--font-ui)',
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Log table ── */}
      {loading ? (
        <div style={{
          background: 'var(--layer-2, var(--layer-2))',
          border: '1px solid var(--border, var(--layer-3))',
          borderRadius: 8,
          padding: '32px 16px',
          textAlign: 'center',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
        }}>
          Loading activity…
        </div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'var(--layer-2, var(--layer-2))',
          border: '1px solid var(--border, var(--layer-3))',
          borderRadius: 8,
          padding: '40px 16px',
          textAlign: 'center',
          fontSize: 12,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
        }}>
          No events match the current filter.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {/* Table column header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '88px 72px 1fr 80px',
            padding: '6px 16px 6px',
            borderBottom: '1px solid var(--border, var(--layer-3))',
            marginBottom: 0,
          }}>
            {['Time', 'Source', 'Event', 'Status'].map(h => (
              <span key={h} style={{
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
                color: 'var(--text-muted, var(--text-muted))',
              }}>{h}</span>
            ))}
            <span /> {/* Status right-aligned, no header text needed beyond label */}
          </div>

          {grouped.map(group => (
            <div key={group.dateLabel}>
              {/* Date separator */}
              <div style={{
                padding: '8px 16px',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase' as const,
                letterSpacing: '0.1em',
                color: 'var(--text-muted, var(--text-muted))',
                background: 'var(--layer-1, var(--layer-1))',
                borderBottom: '1px solid var(--border, var(--layer-3))',
                borderTop: '1px solid var(--border, var(--layer-3))',
              }}>
                {group.dateLabel}
              </div>

              {/* Rows */}
              <div style={{
                background: 'var(--layer-2, var(--layer-2))',
                borderBottom: '1px solid var(--border, var(--layer-3))',
              }}>
                {group.entries.map((e, i) => (
                  <ActivityRow
                    key={e.id}
                    event={e}
                    isLast={i === group.entries.length - 1}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
