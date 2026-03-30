'use client';

import { useEffect, useState, useCallback } from 'react';
import { Kanban, RefreshCw, Plus, ChevronDown, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { dashboardApiAuthHeaders } from '@/lib/dashboard-auth-headers';

// NocoDB table ID for content_pipeline
const TABLE_ID = 'm48nvpornrxuba9';

interface ContentItem {
  Id:           number;
  Titel?:       string;
  Status?:      string;
  Beschreibung?: string;
  Priorität?:   string;
  Kategorie?:   string;
  Datum?:       string;
  Autor?:       string;
  [k: string]:  unknown;
}

// Kanban columns — order matters
const COLUMNS: { id: string; label: string; color: string; bg: string }[] = [
  { id: 'Idee',           label: 'Idee',          color: 'var(--text-secondary)', bg: 'rgba(148,163,184,0.06)' },
  { id: 'In Arbeit',      label: 'In Arbeit',     color: 'var(--accent-blue)', bg: 'rgba(56,189,248,0.06)'  },
  { id: 'Review',         label: 'Review',        color: 'var(--accent-amber)', bg: 'rgba(251,191,36,0.06)'  },
  { id: 'Veröffentlicht', label: 'Veröffentlicht',color: 'var(--accent-green)', bg: 'rgba(52,211,153,0.06)'  },
];

const PRIO_COLOR: Record<string, string> = {
  hoch:   'var(--accent-red)', high:   'var(--accent-red)',
  mittel: 'var(--accent-amber)', medium: 'var(--accent-amber)',
  niedrig:'var(--accent-green)', low:    'var(--accent-green)',
};

const KAT_COLOR: Record<string, string> = {
  'Content':  'var(--accent-amber)', 'Blog': 'var(--accent-amber)', 'Video':   'var(--accent-purple)',
  'Social':   'var(--accent-blue)', 'Email':'var(--accent-blue)', 'Website': 'var(--accent-green)',
};

function timeShort(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  } catch { return ''; }
}

function KanbanCard({ item }: { item: ContentItem }) {
  const prio  = (item.Priorität ?? '').toLowerCase();
  const kat   = item.Kategorie ?? '';
  return (
    <div
      style={{
        background: 'var(--layer-1)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '10px 12px',
        cursor: 'default',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-bright)';
        (e.currentTarget as HTMLDivElement).style.boxShadow  = '0 2px 12px rgba(0,0,0,0.18)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.boxShadow  = 'none';
      }}
    >
      {/* Title */}
      <p style={{
        margin: '0 0 6px', fontSize: 12, fontWeight: 600,
        color: 'var(--text-primary)', lineHeight: 1.35,
      }}>
        {item.Titel ?? `#${item.Id}`}
      </p>

      {/* Description */}
      {item.Beschreibung && (
        <p style={{
          margin: '0 0 8px', fontSize: 10.5, color: 'var(--text-muted)',
          lineHeight: 1.4, display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {item.Beschreibung}
        </p>
      )}

      {/* Footer chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        {prio && (
          <span style={{
            fontSize: 8, fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
            color: PRIO_COLOR[prio] ?? 'var(--text-muted)',
            background: `${PRIO_COLOR[prio] ?? 'var(--text-muted)'}18`,
            padding: '1px 5px', borderRadius: 3,
          }}>
            {item.Priorität}
          </span>
        )}
        {kat && (
          <span style={{
            fontSize: 8, fontFamily: 'var(--font-mono)',
            color: KAT_COLOR[kat] ?? 'var(--text-secondary)',
            background: `${KAT_COLOR[kat] ?? 'var(--text-secondary)'}18`,
            padding: '1px 5px', borderRadius: 3,
          }}>
            {kat}
          </span>
        )}
        {item.Datum && (
          <span style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {timeShort(item.Datum)}
          </span>
        )}
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const [items,      setItems]      = useState<ContentItem[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collapsed,  setCollapsed]  = useState<Set<string>>(new Set());

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const res  = await fetch(`/api/nocodb/table?id=${TABLE_ID}&limit=200`, { headers: { ...dashboardApiAuthHeaders() } });
      const data = await res.json() as ContentItem[] | { list?: ContentItem[] };
      const list: ContentItem[] = Array.isArray(data) ? data : (data.list ?? []);
      setItems(list);
    } catch { /* silent */ }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Group by Status → fall back to "Idee" if unknown
  const grouped = COLUMNS.reduce<Record<string, ContentItem[]>>((acc, col) => {
    acc[col.id] = [];
    return acc;
  }, {});
  for (const item of items) {
    const key = item.Status ?? 'Idee';
    if (grouped[key]) grouped[key].push(item);
    else grouped['Idee'].push(item); // unknown status → Idee column
  }

  const toggleCollapse = (colId: string) =>
    setCollapsed(prev => {
      const next = new Set(prev);
      next.has(colId) ? next.delete(colId) : next.add(colId);
      return next;
    });

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1440, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Kanban size={18} style={{ color: 'var(--accent-amber)' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Content Pipeline
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {items.length} Einträge · NocoDB `content_pipeline`
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            href="https://nocodb.automation-plus-ki.de"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 6, fontSize: 11,
              background: 'var(--layer-1)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', textDecoration: 'none',
            }}
          >
            <ExternalLink size={10} /> NocoDB öffnen
          </Link>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 6, cursor: refreshing ? 'default' : 'pointer',
              background: 'var(--layer-1)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontSize: 11,
            }}
          >
            <RefreshCw size={11} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 10 }}>
          <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--text-muted)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Lade Content Pipeline…</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, alignItems: 'start' }}>
          {COLUMNS.map(col => {
            const colItems  = grouped[col.id] ?? [];
            const isCollapsed = collapsed.has(col.id);
            return (
              <div
                key={col.id}
                style={{
                  background: col.bg,
                  border: `1px solid ${col.color}28`,
                  borderRadius: 10,
                  overflow: 'hidden',
                  minHeight: 120,
                }}
              >
                {/* Column header */}
                <div
                  onClick={() => toggleCollapse(col.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', cursor: 'pointer',
                    borderBottom: isCollapsed ? 'none' : `1px solid ${col.color}28`,
                    userSelect: 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: col.color, display: 'inline-block', flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: col.color, letterSpacing: '0.03em' }}>
                      {col.label}
                    </span>
                    <span style={{
                      fontSize: 9, fontFamily: 'var(--font-mono)',
                      background: `${col.color}22`, color: col.color,
                      padding: '1px 6px', borderRadius: 10,
                    }}>
                      {colItems.length}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Plus size={11} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
                    <ChevronDown
                      size={11}
                      style={{
                        color: 'var(--text-muted)',
                        transform: isCollapsed ? 'rotate(-90deg)' : 'none',
                        transition: 'transform 0.2s',
                      }}
                    />
                  </div>
                </div>

                {/* Cards */}
                {!isCollapsed && (
                  <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {colItems.length === 0 ? (
                      <div style={{
                        textAlign: 'center', padding: '16px 8px',
                        fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                        opacity: 0.6,
                      }}>
                        Keine Einträge
                      </div>
                    ) : (
                      colItems.map(item => <KanbanCard key={item.Id} item={item} />)
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && items.length === 0 && (
        <div style={{
          marginTop: 40, textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <Kanban size={32} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', margin: 0 }}>
            Noch keine Einträge in `content_pipeline`
          </p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
            Einträge via NocoDB oder n8n-Workflow `13_CONTENT_OPPORTUNITY` anlegen.
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
