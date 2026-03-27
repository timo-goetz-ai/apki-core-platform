'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Zap, AlertTriangle, CheckCircle2, Clock, ExternalLink, ChevronRight } from 'lucide-react';
import type { TimelineEvent } from '@/app/api/timeline/route';

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatTime(ts: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: string): string {
  if (!ts) return '—';
  const d = new Date(ts);
  if (isNaN(d.getTime())) return '—';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Heute';
  if (d.toDateString() === yesterday.toDateString()) return 'Gestern';
  return d.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'short' });
}

function groupByDay(events: TimelineEvent[]): { label: string; events: TimelineEvent[] }[] {
  const groups: Record<string, TimelineEvent[]> = {};
  for (const ev of events) {
    const label = formatDate(ev.ts);
    if (!groups[label]) groups[label] = [];
    groups[label].push(ev);
  }
  return Object.entries(groups).map(([label, evs]) => ({ label, events: evs }));
}

const STATUS_CONFIG: Record<TimelineEvent['status'], { color: string; bg: string; icon: React.ReactNode }> = {
  success: { color: '#34d399', bg: 'rgba(52,211,153,0.1)', icon: <CheckCircle2 size={14} /> },
  error:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)', icon: <AlertTriangle size={14} /> },
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', icon: <AlertTriangle size={14} /> },
  info:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.1)', icon: <Zap size={14} /> },
  pending: { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', icon: <Clock size={14} /> },
};

const SOURCE_COLOR: Record<string, string> = {
  'n8n':              '#fb923c',
  'Content Pipeline': '#a78bfa',
  'System':           '#60a5fa',
};

function confidenceAmpel(score?: number): string {
  if (score == null) return '';
  if (score > 85) return '🟢';
  if (score > 50) return '🟡';
  return '🔴';
}

// ── Event Card ─────────────────────────────────────────────────────────────────

function EventCard({ event, onAction }: { event: TimelineEvent; onAction: () => void }) {
  const cfg      = STATUS_CONFIG[event.status];
  const srcColor = SOURCE_COLOR[event.source] ?? '#475569';
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(action: NonNullable<TimelineEvent['actions']>[0]) {
    if (action.href) { window.open(action.href, '_blank'); return; }
    if (!action.api) return;
    setLoading(action.label);
    try {
      await fetch(action.api, {
        method: action.method ?? 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: action.body ? JSON.stringify(action.body) : undefined,
      });
      onAction();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{
      display: 'flex',
      gap: '12px',
      padding: '10px 12px',
      borderRadius: '8px',
      background: 'var(--layer-1)',
      border: `1px solid var(--border)`,
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = cfg.color + '60')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {/* Time */}
      <div style={{ minWidth: 42, color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', paddingTop: 2, textAlign: 'right' }}>
        {formatTime(event.ts)}
      </div>

      {/* Dot + line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, marginTop: 4, flexShrink: 0 }} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Source badge */}
          <span style={{
            fontSize: 10, fontWeight: 600, color: srcColor,
            background: srcColor + '18', borderRadius: 4,
            padding: '1px 6px', letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            {event.source}
          </span>

          {/* Status icon */}
          <span style={{ color: cfg.color }}>{cfg.icon}</span>

          {/* Title */}
          <span style={{ fontWeight: 500, fontSize: 13, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>
            {event.title}
          </span>

          {/* Confidence */}
          {event.confidence != null && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {confidenceAmpel(event.confidence)} {event.confidence}%
            </span>
          )}
        </div>

        {event.description && (
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {event.description}
          </p>
        )}

        {/* Meta chips */}
        {event.meta && Object.keys(event.meta).length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap' }}>
            {Object.entries(event.meta).map(([k, v]) => v != null && v !== '' && v !== false ? (
              <span key={k} style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--layer-2)', borderRadius: 3, padding: '1px 6px' }}>
                {k}: {String(v)}
              </span>
            ) : null)}
          </div>
        )}

        {/* Actions */}
        {event.actions && event.actions.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {event.actions.map(action => (
              <button
                key={action.label}
                onClick={() => handleAction(action)}
                disabled={loading === action.label}
                style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontWeight: 600,
                  background: action.variant === 'primary' ? '#34d399' : action.variant === 'danger' ? '#f87171' : 'var(--layer-2)',
                  color:      action.variant === 'primary' ? '#052e16' : action.variant === 'danger' ? '#1f0909' : 'var(--text-secondary)',
                  opacity: loading === action.label ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                {loading === action.label ? '…' : action.label}
                {action.href && <ExternalLink size={10} />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function TimelineFeed() {
  const [events, setEvents]         = useState<TimelineEvent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filter, setFilter]         = useState<'all' | 'pending' | 'error'>('all');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/timeline');
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events ?? []);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = events.filter(e => {
    if (filter === 'pending') return e.status === 'pending';
    if (filter === 'error')   return e.status === 'error' || e.status === 'warning';
    return true;
  });

  const groups   = groupByDay(filtered);
  const pending  = events.filter(e => e.status === 'pending').length;
  const errors   = events.filter(e => e.status === 'error').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChevronRight size={16} color="var(--accent-blue)" />
          System Timeline
        </h2>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {(['all', 'pending', 'error'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 5, border: 'none', cursor: 'pointer', fontWeight: 600,
                background: filter === f ? 'var(--accent-blue)' : 'var(--layer-2)',
                color:      filter === f ? '#fff' : 'var(--text-muted)',
              }}
            >
              {f === 'all' ? 'Alle' : f === 'pending' ? `Ausstehend ${pending > 0 ? `(${pending})` : ''}` : `Fehler ${errors > 0 ? `(${errors})` : ''}`}
            </button>
          ))}
        </div>

        <button
          onClick={load}
          style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
        >
          <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {lastRefresh ? lastRefresh.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '—'}
        </button>
      </div>

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '48px 0' }}>
          {filter === 'pending' ? '✅ Keine ausstehenden Aktionen.' : filter === 'error' ? '✅ Keine Fehler.' : 'Noch keine Events heute.'}
        </div>
      )}

      {/* Timeline groups */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto' }}>
        {groups.map(group => (
          <div key={group.label}>
            {/* Day label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {group.label}
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{group.events.length} Events</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {group.events.map(ev => (
                <EventCard key={ev.id} event={ev} onAction={load} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
