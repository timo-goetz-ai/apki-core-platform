'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Radio } from 'lucide-react';

interface FeedItem {
  id:    string;
  icon:  string;
  text:  string;
  sub:   string;
  ts:    number;
  color: string;
  type:  string;
  ok:    boolean;
}

function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'jetzt';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  'n8n-execution':   { label: 'n8n',    color: '#38bdf8' },
  'n8n-trigger':     { label: 'n8n',    color: '#38bdf8' },
  'prometheus-alert':{ label: 'prom',   color: '#f87171' },
  'deploy':          { label: 'deploy', color: '#a78bfa' },
  'scanner':         { label: 'scan',   color: '#fbbf24' },
  'github-push':     { label: 'git',    color: '#94a3b8' },
};

export function LiveActivityFeed() {
  const [items,      setItems]      = useState<FeedItem[]>([]);
  const [newFlash,   setNewFlash]   = useState(false);
  const [liveCount,  setLiveCount]  = useState(0);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const seenIds = useRef(new Set<string>());

  const fetchLive = useCallback(async () => {
    try {
      const res = await fetch('/api/activity/live');
      if (!res.ok) return;
      const data = await res.json() as { events?: FeedItem[]; liveCount?: number };
      const events: FeedItem[] = data.events ?? [];

      // Flash if new events arrived
      const newOnes = events.filter(e => !seenIds.current.has(e.id));
      if (newOnes.length > 0) {
        setNewFlash(true);
        setTimeout(() => setNewFlash(false), 800);
        newOnes.forEach(e => seenIds.current.add(e.id));
      }

      setItems(events);
      setLiveCount(data.liveCount ?? 0);
      setLastUpdate(Date.now());
    } catch { /* silent — server might be restarting */ }
  }, []);

  useEffect(() => {
    fetchLive();
    const t = setInterval(fetchLive, 10_000);
    return () => clearInterval(t);
  }, [fetchLive]);

  // Placeholder items shown before first fetch
  const displayItems: FeedItem[] = items.length > 0 ? items : [
    { id: 'boot-1', icon: '▸', text: 'Dashboard gestartet', sub: 'system', ts: Date.now() - 5000, color: '#60a5fa', type: 'info', ok: true },
    { id: 'boot-2', icon: '▸', text: 'Services werden geprüft…', sub: 'health-check', ts: Date.now() - 3000, color: '#34d399', type: 'info', ok: true },
  ];

  return (
    <>
      {/* Header row — rendered by caller via WHeader, but we add live indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Radio size={11} style={{ color: newFlash ? '#34d399' : 'var(--text-muted)', transition: 'color 0.3s' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
            Activity Feed
          </span>
          {liveCount > 0 && (
            <span style={{
              fontSize: 8, fontFamily: 'var(--font-mono)',
              background: '#38bdf822', color: '#38bdf8',
              padding: '1px 5px', borderRadius: 10,
            }}>
              {liveCount} live
            </span>
          )}
        </div>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          {lastUpdate > 0 ? `${timeAgo(lastUpdate)} aktualisiert` : 'live'}
        </span>
      </div>

      {/* Feed list */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 1,
        maxHeight: 190, overflowY: 'auto',
        opacity: items.length === 0 ? 0.5 : 1,
      }}>
        {displayItems.map((item, idx) => {
          const badge = TYPE_BADGE[item.type];
          return (
            <div
              key={item.id}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '5px 3px',
                borderBottom: idx < displayItems.length - 1 ? '1px solid var(--border)' : 'none',
                animation: newFlash && idx === 0 ? 'feed-flash 0.4s ease' : 'none',
              }}
            >
              <span style={{ fontSize: 12, width: 16, textAlign: 'center', flexShrink: 0, marginTop: 1, lineHeight: 1.3 }}>
                {item.icon}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <p style={{
                    margin: 0, fontSize: 11, color: 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                  }}>
                    {item.text}
                  </p>
                  {badge && (
                    <span style={{
                      fontSize: 7.5, fontFamily: 'var(--font-mono)',
                      color: badge.color, background: `${badge.color}18`,
                      padding: '1px 4px', borderRadius: 3, flexShrink: 0,
                    }}>
                      {badge.label}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {item.sub}
                </p>
              </div>
              <span style={{
                fontSize: 9, fontFamily: 'var(--font-mono)',
                color: 'var(--text-muted)', flexShrink: 0, marginTop: 2,
              }}>
                {timeAgo(item.ts)}
              </span>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes feed-flash {
          0%   { background: rgba(52,211,153,0.12); }
          100% { background: transparent; }
        }
      `}</style>
    </>
  );
}
