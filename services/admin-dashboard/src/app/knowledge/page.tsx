'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BookOpen, RefreshCw, ExternalLink, AlertTriangle,
  Layers, Zap, Puzzle, Anchor, Users, Settings2, Bot, FileText, Brain,
} from 'lucide-react';

// ─── NocoDB config ────────────────────────────────────────────────────────────
const NOCO_BASE = 'https://nocodb.automation-plus-ki.de';
const NOCO_PROJECT = 'pfx0ca6docorj8n';
const NOCO_TOKEN = '***REDACTED_NOCODB_TOKEN***';

const TABLE_IDS: Record<string, string> = {
  rules:           'mcn1qpaapk5x849',
  skills:          'mdkwfxgjg80tgjd',
  plugins:         'mbt77n1toqpa094',
  hooks:           'mgnxselg5bkglr8',
  agents:          'mjdp54ldeoxlb8s',
  subagents:       'm6kwm1cedzeou6w',
  prompts:         'mijlvsujsgqa92m',
  knowledge_items: 'm9hgs3y3iz9xtgl',
  clients:         'mxfirejid6z3h5g',
  cursor_configs:  'mzzgzfzgatrauwy',
};

type TabKey = 'rules' | 'skills' | 'plugins' | 'hooks' | 'agents' | 'subagents' | 'prompts' | 'knowledge_items';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'rules',           label: 'Rules',         icon: <Layers size={13} /> },
  { key: 'skills',          label: 'Skills',         icon: <Zap size={13} /> },
  { key: 'plugins',         label: 'Plugins',        icon: <Puzzle size={13} /> },
  { key: 'hooks',           label: 'Hooks',          icon: <Anchor size={13} /> },
  { key: 'agents',          label: 'Agents',         icon: <Bot size={13} /> },
  { key: 'subagents',       label: 'SubAgents',      icon: <Users size={13} /> },
  { key: 'prompts',         label: 'Prompts',        icon: <FileText size={13} /> },
  { key: 'knowledge_items', label: 'Knowledge',      icon: <Brain size={13} /> },
];

type Row = Record<string, unknown>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchTable(tableId: string): Promise<Row[]> {
  const url = `${NOCO_BASE}/api/v1/db/data/noco/${NOCO_PROJECT}/${tableId}?limit=100`;
  const res = await fetch(url, {
    headers: { 'xc-token': NOCO_TOKEN },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.list ?? []);
}

function statusColor(status: string | undefined): { bg: string; text: string; dot: string } {
  const s = (status ?? '').toLowerCase();
  if (['active', 'aktiv', 'enabled', 'on'].includes(s))
    return { bg: 'rgba(34,197,94,0.12)', text: '#22c55e', dot: '#22c55e' };
  if (['paused', 'pausiert', 'warning'].includes(s))
    return { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', dot: '#f59e0b' };
  if (['error', 'offline', 'disabled'].includes(s))
    return { bg: 'rgba(239,68,68,0.1)', text: '#ef4444', dot: '#ef4444' };
  return { bg: 'rgba(100,116,139,0.12)', text: '#94a3b8', dot: '#64748b' };
}

function SkeletonRow() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '2fr 1fr 3fr', gap: 16,
      padding: '12px 16px', borderBottom: '1px solid var(--border, #2d3748)',
      alignItems: 'center',
    }}>
      {[140, 70, 220].map((w, i) => (
        <div key={i} style={{
          height: 12, width: w, borderRadius: 4,
          background: 'var(--layer-3, #2a3347)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div style={{
      padding: '48px 24px', textAlign: 'center',
      color: 'var(--text-secondary, #94a3b8)',
    }}>
      <BookOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.35, display: 'block' }} />
      <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
        Noch keine Einträge in <strong>{tab}</strong>
      </p>
      <a
        href={`${NOCO_BASE}`}
        target="_blank"
        rel="noreferrer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          marginTop: 12, fontSize: 13,
          color: 'var(--accent-blue, #3b82f6)',
          textDecoration: 'none',
        }}
      >
        In NocoDB hinzufügen <ExternalLink size={11} />
      </a>
    </div>
  );
}

function RowItem({ row, index }: { row: Row; index: number }) {
  // Derive the most useful columns dynamically
  const name = row.Name ?? row.name ?? row.Titel ?? row.title ?? row.Title ?? '—';
  const status = row.Status ?? row.status ?? row.active ?? undefined;
  const desc = row.Beschreibung ?? row.description ?? row.Description ?? row.content ?? row.Content ?? '';
  const badge = statusColor(typeof status === 'boolean' ? (status ? 'active' : 'disabled') : status);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 12,
      padding: '13px 20px',
      borderBottom: '1px solid var(--border, #2d3748)',
      background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
      transition: 'background 0.1s',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)')}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{
            fontSize: 13, fontWeight: 600,
            color: 'var(--text-primary, #f1f5f9)',
          }}>
            {String(name)}
          </span>
          {desc && (
            <span style={{
              fontSize: 12, color: 'var(--text-secondary, #94a3b8)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              maxWidth: 400,
            }}>
              {String(desc).slice(0, 120)}{String(desc).length > 120 ? '…' : ''}
            </span>
          )}
        </div>
        {/* Extra meta fields */}
        <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
          {Object.entries(row)
            .filter(([k]) => !['Id', 'id', 'Name', 'name', 'Titel', 'title', 'Title',
                               'Status', 'status', 'active', 'Beschreibung', 'description',
                               'Description', 'content', 'Content',
                               'CreatedAt', 'UpdatedAt', 'nc_order'].includes(k))
            .slice(0, 4)
            .map(([k, v]) => (
              <span key={k} style={{ fontSize: 10, color: 'var(--text-muted, #64748b)', fontFamily: 'var(--font-mono, monospace)' }}>
                <span style={{ opacity: 0.6 }}>{k}: </span>
                {String(v ?? '—').slice(0, 40)}
              </span>
            ))}
        </div>
      </div>

      {status !== undefined && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: badge.bg, color: badge.text,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: badge.dot, flexShrink: 0 }} />
            {typeof status === 'boolean' ? (status ? 'Aktiv' : 'Deaktiviert') : String(status)}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Stat cards ───────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon }: {
  label: string; value: number | string; color: string; icon: React.ReactNode;
}) {
  return (
    <div style={{
      background: 'var(--layer-2, #1e2535)',
      border: '1px solid var(--border, #2d3748)',
      borderRadius: 12, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 14,
      flex: '1 1 180px',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: 'var(--layer-3, #2a3347)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary, #94a3b8)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('rules');
  const [data, setData] = useState<Partial<Record<TabKey, Row[]>>>({});
  const [loading, setLoading] = useState<Partial<Record<TabKey, boolean>>>({});
  const [errors, setErrors] = useState<Partial<Record<TabKey, string>>>({});
  const [counts, setCounts] = useState<Partial<Record<TabKey, number>>>({});

  const loadTab = useCallback(async (tab: TabKey) => {
    const tableId = TABLE_IDS[tab];
    if (!tableId) return;
    setLoading(prev => ({ ...prev, [tab]: true }));
    setErrors(prev => ({ ...prev, [tab]: undefined }));
    try {
      const rows = await fetchTable(tableId);
      setData(prev => ({ ...prev, [tab]: rows }));
      setCounts(prev => ({ ...prev, [tab]: rows.length }));
    } catch (e) {
      setErrors(prev => ({ ...prev, [tab]: (e as Error).message }));
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  }, []);

  // Load all tabs for counts on mount
  useEffect(() => {
    TABS.forEach(t => loadTab(t.key));
  }, [loadTab]);

  const currentRows = data[activeTab] ?? [];
  const isLoading = loading[activeTab] ?? false;
  const currentError = errors[activeTab];

  // Stat card values
  const rulesCount = counts.rules ?? '…';
  const pluginsCount = counts.plugins ?? '…';
  const subagentsCount = counts.subagents ?? '…';
  const knowledgeCount = counts.knowledge_items ?? '…';

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', fontFamily: 'var(--font-ui, inherit)' }}>

      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 22, fontWeight: 700,
            color: 'var(--text-primary, #f1f5f9)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <BookOpen size={22} color="var(--accent-blue, #3b82f6)" />
            Knowledge Base
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary, #94a3b8)' }}>
            AI_SYSTEM Datenzentrum — Regeln, Skills, Agenten &amp; mehr aus NocoDB
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => loadTab(activeTab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 8, fontSize: 13,
              background: 'var(--layer-2, #1e2535)',
              border: '1px solid var(--border, #2d3748)',
              color: 'var(--text-secondary, #94a3b8)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={13} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
            Aktualisieren
          </button>
          <a
            href={NOCO_BASE}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              background: 'var(--accent-blue, #3b82f6)',
              color: '#fff', textDecoration: 'none',
            }}
          >
            In NocoDB öffnen <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="Total Rules"      value={rulesCount}    color="#3b82f6" icon={<Layers size={18} />} />
        <StatCard label="Active Plugins"   value={pluginsCount}  color="#a855f7" icon={<Puzzle size={18} />} />
        <StatCard label="SubAgents"        value={subagentsCount} color="#22c55e" icon={<Settings2 size={18} />} />
        <StatCard label="Knowledge Items"  value={knowledgeCount} color="#f59e0b" icon={<Brain size={18} />} />
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4, flexWrap: 'wrap',
        marginBottom: 16,
        background: 'var(--layer-2, #1e2535)',
        border: '1px solid var(--border, #2d3748)',
        borderRadius: 12, padding: 6,
      }}>
        {TABS.map(t => {
          const isActive = t.key === activeTab;
          const count = counts[t.key];
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 8, fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                background: isActive ? 'var(--accent-blue, #3b82f6)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-secondary, #94a3b8)',
                border: 'none', cursor: 'pointer',
                transition: 'all 0.12s ease',
              }}
            >
              {t.icon}
              {t.label}
              {count !== undefined && (
                <span style={{
                  padding: '1px 6px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                  background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--layer-3, #2a3347)',
                  color: isActive ? '#fff' : 'var(--text-muted, #64748b)',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Table panel */}
      <div style={{
        background: 'var(--layer-2, #1e2535)',
        border: '1px solid var(--border, #2d3748)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        {/* Panel header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid var(--border, #2d3748)',
          background: 'var(--layer-3, #2a3347)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary, #f1f5f9)' }}>
            {TABS.find(t => t.key === activeTab)?.label ?? activeTab}
            {currentRows.length > 0 && (
              <span style={{
                marginLeft: 8, fontSize: 11, fontWeight: 400,
                color: 'var(--text-muted, #64748b)',
              }}>
                {currentRows.length} Einträge
              </span>
            )}
          </span>
          <a
            href={`${NOCO_BASE}/dashboard`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 12, color: 'var(--accent-blue, #3b82f6)',
              textDecoration: 'none',
            }}
          >
            Hinzufügen <ExternalLink size={11} />
          </a>
        </div>

        {/* Content */}
        {currentError ? (
          <div style={{
            padding: '32px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            color: 'var(--text-secondary, #94a3b8)',
          }}>
            <AlertTriangle size={24} color="#ef4444" />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#ef4444' }}>Fehler beim Laden</p>
            <p style={{ margin: 0, fontSize: 13 }}>{currentError}</p>
            <button
              onClick={() => loadTab(activeTab)}
              style={{
                marginTop: 8, padding: '7px 16px', borderRadius: 8, fontSize: 13,
                background: 'var(--layer-3, #2a3347)',
                border: '1px solid var(--border, #2d3748)',
                color: 'var(--text-primary, #f1f5f9)', cursor: 'pointer',
              }}
            >
              Erneut versuchen
            </button>
          </div>
        ) : isLoading ? (
          <div>
            {Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : currentRows.length === 0 ? (
          <EmptyState tab={TABS.find(t => t.key === activeTab)?.label ?? activeTab} />
        ) : (
          <div>
            {currentRows.map((row, i) => (
              <RowItem key={row.Id ?? row.id ?? i} row={row} index={i} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
