'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  BookOpen, RefreshCw, ExternalLink, AlertTriangle,
  Layers, Zap, Puzzle, Anchor, Users, Settings2, Bot, FileText, Brain,
  Link, Server, Copy, Check,
} from 'lucide-react';
import { dashboardApiAuthHeaders } from '@/lib/dashboard-auth-headers';

// ─── NocoDB config ────────────────────────────────────────────────────────────
const NOCO_BASE = 'https://nocodb.automation-plus-ki.de';

const TABLE_IDS: Record<string, string> = {
  rules:           'mcn1qpaapk5x849',
  skills:          'mdkwfxgjg80tgjd',
  plugins:         'mbt77n1toqpa094',
  hooks:           'mgnxselg5bkglr8',
  agents:          'mjdp54ldeoxlb8s',
  subagents:       'm6kwm1cedzeou6w',
  prompts:         'mijlvsujsgqa92m',
  knowledge_items: 'm9hgs3y3iz9xtgl',
};

type TabKey = 'rules' | 'skills' | 'plugins' | 'hooks' | 'agents' | 'subagents' | 'prompts' | 'knowledge_items';

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'rules',           label: 'Rules',       icon: <Layers size={13} /> },
  { key: 'skills',          label: 'Skills',       icon: <Zap size={13} /> },
  { key: 'plugins',         label: 'Plugins',      icon: <Puzzle size={13} /> },
  { key: 'hooks',           label: 'Hooks',        icon: <Anchor size={13} /> },
  { key: 'agents',          label: 'Agents',       icon: <Bot size={13} /> },
  { key: 'subagents',       label: 'SubAgents',    icon: <Users size={13} /> },
  { key: 'prompts',         label: 'Prompts',      icon: <FileText size={13} /> },
  { key: 'knowledge_items', label: 'Knowledge',    icon: <Brain size={13} /> },
];

// ─── Quick links & API addresses ──────────────────────────────────────────────
const QUICK_LINKS = [
  { label: 'n8n Workflows',  url: 'http://10.0.1.29:5678',                         color: 'var(--accent-amber)', desc: 'Workflow-Editor' },
  { label: 'NocoDB',         url: 'https://nocodb.automation-plus-ki.de',           color: 'var(--accent-green)', desc: 'Datenbank-UI' },
  { label: 'Grafana',        url: 'https://grafana.automation-plus-ki.de',          color: 'var(--accent-amber)', desc: 'Monitoring' },
  { label: 'Prometheus',     url: 'https://prometheus.automation-plus-ki.de',       color: 'var(--accent-purple)', desc: 'Metriken' },
  { label: 'Coolify',        url: 'https://coolify.automation-plus-ki.de',          color: 'var(--accent-blue)', desc: 'Deployment' },
  { label: 'Authentik',      url: 'https://auth.automation-plus-ki.de',             color: 'var(--accent-amber)', desc: 'Identity Provider' },
];

const API_ENDPOINTS = [
  { label: 'n8n API',          url: 'http://10.0.1.29:5678/api/v1',                desc: 'Workflows & Executions',    auth: 'X-N8N-API-KEY' },
  { label: 'NocoDB API',       url: 'https://nocodb.automation-plus-ki.de/api/v1', desc: 'Tabellen & Datensätze',     auth: 'xc-token' },
  { label: 'AIOS Core API',   url: 'https://api.automation-plus-ki.de',           desc: 'Python FastAPI Backend',    auth: 'Bearer Token' },
  { label: 'Dashboard API',    url: '/api/nocodb/table?id=TABLE_ID',               desc: 'Interne Next.js Routen',    auth: 'Session' },
  { label: 'Prometheus API',   url: 'http://10.0.1.29:9090/api/v1',               desc: 'Metriken & Queries',        auth: 'kein Auth' },
  { label: 'Grafana API',      url: 'https://grafana.automation-plus-ki.de/api',   desc: 'Dashboards & Alerting',     auth: 'Bearer Token' },
];

type Row = Record<string, unknown>;

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function fetchTable(tableId: string): Promise<Row[]> {
  const res = await fetch(`/api/nocodb/table?id=${tableId}&limit=100`, {
    signal: AbortSignal.timeout(10000),
    headers: { ...dashboardApiAuthHeaders() },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : (data.list ?? []);
}

function statusColor(status: string | undefined): { bg: string; text: string; dot: string } {
  const s = (status ?? '').toLowerCase();
  if (['active', 'aktiv', 'enabled', 'on'].includes(s))
    return { bg: 'rgba(34,197,94,0.12)', text: 'var(--accent-green)', dot: 'var(--accent-green)' };
  if (['paused', 'pausiert', 'warning'].includes(s))
    return { bg: 'rgba(245,158,11,0.12)', text: 'var(--accent-amber)', dot: 'var(--accent-amber)' };
  if (['error', 'offline', 'disabled'].includes(s))
    return { bg: 'rgba(239,68,68,0.1)', text: 'var(--accent-red)', dot: 'var(--accent-red)' };
  return { bg: 'rgba(100,116,139,0.12)', text: 'var(--text-secondary)', dot: 'var(--text-secondary)' };
}

// ─── Copy button ──────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      style={{
        padding: '2px 6px', borderRadius: 4, cursor: 'pointer',
        background: 'transparent', border: '1px solid transparent',
        color: 'var(--text-muted)', fontSize: 10,
        display: 'inline-flex', alignItems: 'center', gap: 3,
        transition: 'all 0.1s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; }}
      title="Kopieren"
    >
      {copied ? <Check size={10} style={{ color: 'var(--accent-green)' }} /> : <Copy size={10} />}
    </button>
  );
}

// ─── Row item ─────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '2fr 1fr 3fr', gap: 16,
      padding: '12px 16px', borderBottom: '1px solid var(--border)',
      alignItems: 'center',
    }}>
      {[140, 70, 220].map((w, i) => (
        <div key={i} style={{ height: 12, width: w, borderRadius: 4, background: 'var(--layer-3)' }} />
      ))}
    </div>
  );
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
      <BookOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
      <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>
        Noch keine Einträge in <strong>{tab}</strong>
      </p>
      <a
        href={NOCO_BASE}
        target="_blank"
        rel="noreferrer"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 12, fontSize: 13, color: 'var(--accent-blue)', textDecoration: 'none' }}
      >
        In NocoDB hinzufügen <ExternalLink size={11} />
      </a>
    </div>
  );
}

function RowItem({ row, index }: { row: Row; index: number }) {
  const name      = String(row.Name ?? row.name ?? row.Titel ?? row.title ?? row.Title ?? '—');
  const statusRaw = row.Status ?? row.status ?? row.active;
  const statusStr: string | undefined = typeof statusRaw === 'boolean'
    ? (statusRaw ? 'Aktiv' : 'Inaktiv')
    : typeof statusRaw === 'string' ? statusRaw : undefined;
  const desc  = String(row.Beschreibung ?? row.description ?? row.Description ?? row.content ?? row.Content ?? '');
  const badge = statusColor(statusStr);

  return (
    <div
      style={{
        display: 'grid', gridTemplateColumns: '1fr auto', gap: 12,
        padding: '13px 20px', borderBottom: '1px solid var(--border)',
        background: index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = index % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)')}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {name}
          </span>
          {desc && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
              {String(desc).slice(0, 120)}{String(desc).length > 120 ? '…' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
          {Object.entries(row)
            .filter(([k]) => !['Id', 'id', 'Name', 'name', 'Titel', 'title', 'Title',
              'Status', 'status', 'active', 'Beschreibung', 'description',
              'Description', 'content', 'Content', 'CreatedAt', 'UpdatedAt', 'nc_order'].includes(k))
            .slice(0, 4)
            .map(([k, v]) => (
              <span key={k} style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                <span style={{ opacity: 0.6 }}>{k}: </span>
                {String(v ?? '—').slice(0, 40)}
              </span>
            ))}
        </div>
      </div>
      {statusStr !== undefined && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
            background: badge.bg, color: badge.text,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: badge.dot, flexShrink: 0 }} />
            {statusStr}
          </span>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number | string; color: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--layer-2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 20px',
      display: 'flex', alignItems: 'center', gap: 14, flex: '1 1 160px',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 9, background: 'var(--layer-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <div style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function KnowledgePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('rules');
  const [data, setData]           = useState<Partial<Record<TabKey, Row[]>>>({});
  const [loading, setLoading]     = useState<Partial<Record<TabKey, boolean>>>({});
  const [errors, setErrors]       = useState<Partial<Record<TabKey, string>>>({});
  const [counts, setCounts]       = useState<Partial<Record<TabKey, number>>>({});
  const [section, setSection]     = useState<'data' | 'links' | 'api'>('data');

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

  useEffect(() => { TABS.forEach(t => loadTab(t.key)); }, [loadTab]);

  const currentRows  = data[activeTab] ?? [];
  const isLoading    = loading[activeTab] ?? false;
  const currentError = errors[activeTab];

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', fontFamily: 'var(--font-ui)' }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <BookOpen size={22} color="var(--accent-blue, var(--accent-blue))" />
            Knowledge Base
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
            AI_SYSTEM Datenzentrum — Regeln, Skills, Agenten, API-Adressen &amp; Quick Links
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => loadTab(activeTab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 8, fontSize: 13,
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
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
              background: 'var(--accent-blue, var(--accent-blue))', color: 'white', textDecoration: 'none',
            }}
          >
            NocoDB öffnen <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="Rules"          value={counts.rules ?? '…'}          color="var(--accent-blue)" icon={<Layers size={18} />} />
        <StatCard label="Plugins"        value={counts.plugins ?? '…'}        color="var(--accent-purple)" icon={<Puzzle size={18} />} />
        <StatCard label="SubAgents"      value={counts.subagents ?? '…'}      color="var(--accent-green)" icon={<Settings2 size={18} />} />
        <StatCard label="Knowledge Items" value={counts.knowledge_items ?? '…'} color="var(--accent-amber)" icon={<Brain size={18} />} />
      </div>

      {/* ── Section switcher ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {([
          { id: 'data',  label: 'Wissensdaten',  icon: <Brain size={13} /> },
          { id: 'links', label: 'Quick Links',   icon: <Link size={13} /> },
          { id: 'api',   label: 'API-Adressen',  icon: <Server size={13} /> },
        ] as const).map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
              fontWeight: section === s.id ? 600 : 400,
              background: section === s.id ? 'rgba(59,130,246,0.12)' : 'var(--layer-2)',
              border: section === s.id ? '1px solid rgba(59,130,246,0.3)' : '1px solid var(--border)',
              color: section === s.id ? 'var(--accent-blue)' : 'var(--text-secondary)',
              transition: 'all 0.12s',
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── Section: Wissensdaten ── */}
      {section === 'data' && (
        <>
          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16,
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 6,
          }}>
            {TABS.map(t => {
              const isActive = t.key === activeTab;
              const count    = counts[t.key];
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 8, fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? 'var(--accent-blue, var(--accent-blue))' : 'transparent',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    border: 'none', cursor: 'pointer', transition: 'all 0.12s',
                  }}
                >
                  {t.icon} {t.label}
                  {count !== undefined && (
                    <span style={{
                      padding: '1px 6px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                      background: isActive ? 'rgba(255,255,255,0.2)' : 'var(--layer-3)',
                      color: isActive ? 'white' : 'var(--text-muted)',
                    }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Table panel */}
          <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px', borderBottom: '1px solid var(--border)',
              background: 'var(--layer-3)',
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                {TABS.find(t => t.key === activeTab)?.label ?? activeTab}
                {currentRows.length > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: 'var(--text-muted)' }}>
                    {currentRows.length} Einträge
                  </span>
                )}
              </span>
              <a
                href={`${NOCO_BASE}/dashboard`}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--accent-blue, var(--accent-blue))', textDecoration: 'none' }}
              >
                Hinzufügen <ExternalLink size={11} />
              </a>
            </div>
            {currentError ? (
              <div style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--text-secondary)' }}>
                <AlertTriangle size={24} color="var(--accent-red)" />
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--accent-red)' }}>Fehler beim Laden</p>
                <p style={{ margin: 0, fontSize: 13 }}>{currentError}</p>
                <button onClick={() => loadTab(activeTab)} style={{ marginTop: 8, padding: '7px 16px', borderRadius: 8, fontSize: 13, background: 'var(--layer-3)', border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Erneut versuchen
                </button>
              </div>
            ) : isLoading ? (
              <div>{Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)}</div>
            ) : currentRows.length === 0 ? (
              <EmptyState tab={TABS.find(t => t.key === activeTab)?.label ?? activeTab} />
            ) : (
              <div>{currentRows.map((row, i) => <RowItem key={String(row.Id ?? row.id ?? i)} row={row} index={i} />)}</div>
            )}
          </div>
        </>
      )}

      {/* ── Section: Quick Links ── */}
      {section === 'links' && (
        <div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
            Direktzugriff auf alle wichtigen Services im AIOS-Stack.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {QUICK_LINKS.map(link => (
              <a
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block', textDecoration: 'none',
                  background: 'var(--layer-2)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '16px 20px',
                  transition: 'border-color 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = link.color + '44'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: link.color, boxShadow: `0 0 5px ${link.color}80`, flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{link.label}</span>
                  </div>
                  <ExternalLink size={12} style={{ color: 'var(--text-muted)' }} />
                </div>
                <p style={{ margin: '0 0 8px 16px', fontSize: 12, color: 'var(--text-muted)' }}>{link.desc}</p>
                <p style={{ margin: '0 0 0 16px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {link.url}
                </p>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Section: API-Adressen ── */}
      {section === 'api' && (
        <div>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
            Interne und externe API-Endpunkte für Agenten, Workflows und Integrationen.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {API_ENDPOINTS.map(ep => (
              <div
                key={ep.url}
                style={{
                  background: 'var(--layer-2)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '14px 18px',
                  display: 'grid', gridTemplateColumns: '200px 1fr auto', gap: 16, alignItems: 'center',
                }}
              >
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{ep.label}</p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)' }}>{ep.desc}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <code style={{
                    flex: 1, fontSize: 11, fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-blue)', background: 'rgba(56,189,248,0.06)',
                    padding: '4px 8px', borderRadius: 5, border: '1px solid rgba(56,189,248,0.12)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                  }}>
                    {ep.url}
                  </code>
                  <CopyBtn text={ep.url} />
                </div>
                <span style={{
                  fontSize: 10, fontFamily: 'var(--font-mono)',
                  padding: '3px 8px', borderRadius: 5,
                  background: 'var(--layer-3)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0,
                }}>
                  {ep.auth}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
