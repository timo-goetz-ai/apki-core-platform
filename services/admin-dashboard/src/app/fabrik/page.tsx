'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Cpu, Globe, Database, Terminal, Search, RefreshCw,
  ExternalLink, CheckCircle2, XCircle, ChevronRight,
} from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { dashboardApiAuthHeaders } from '@/lib/dashboard-auth-headers';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CoolifyService {
  uuid: string;
  name: string;
  status?: string;
  fqdn?: string;
  description?: string;
}

interface MCPServer {
  name: string;
  url?: string;
  status?: string;
  health?: 'healthy' | 'unhealthy' | 'unknown';
}

interface NocoAgent {
  Id: number;
  Name: string;
  Typ?: string;
  Model?: string;
  Status?: string;
  Phase?: string;
}

// ── Tab Config ────────────────────────────────────────────────────────────────

type TabId = 'deployments' | 'mcp' | 'registry' | 'explorer';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'deployments', label: 'Deployments', icon: Cpu },
  { id: 'mcp',         label: 'MCP Server',  icon: Globe },
  { id: 'registry',    label: 'Registry',     icon: Database },
  { id: 'explorer',    label: 'API Explorer', icon: Terminal },
];

// ── Deployments Tab ──────────────────────────────────────────────────────────

function DeploymentsTab() {
  const [services, setServices] = useState<CoolifyService[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/coolify/services', { headers: { ...dashboardApiAuthHeaders() } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setServices(Array.isArray(d) ? d : d?.services ?? []))
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState text="Lade Coolify Services…" />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
      {services.length === 0 && <EmptyState text="Keine Coolify Services gefunden" />}
      {services.map(svc => {
        const isRunning = svc.status === 'running' || svc.status === 'healthy';
        return (
          <div key={svc.uuid} style={{
            background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 10,
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: isRunning ? 'var(--accent-green)' : 'var(--accent-red)',
              boxShadow: isRunning ? '0 0 6px var(--accent-green)' : 'none',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {svc.name}
              </div>
              {svc.fqdn && (
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {svc.fqdn}
                </div>
              )}
            </div>
            <span style={{
              fontSize: 9, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
              background: isRunning ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
              color: isRunning ? 'var(--accent-green)' : 'var(--accent-red)',
            }}>
              {svc.status ?? 'unknown'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── MCP Server Tab ───────────────────────────────────────────────────────────

function MCPTab() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mcp-plattform/dienste', { headers: { ...dashboardApiAuthHeaders() } })
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        const list = Array.isArray(d) ? d : d?.list ?? [];
        setServers(list.map((s: Record<string, unknown>) => ({
          name: String(s.Name ?? s.name ?? ''),
          url: String(s.URL ?? s.url ?? ''),
          status: String(s.Status ?? s.status ?? 'unknown'),
          health: s.Status === 'Aktiv' ? 'healthy' as const : 'unknown' as const,
        })));
      })
      .catch(() => setServers([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState text="Lade MCP Server…" />;

  const healthy = servers.filter(s => s.health === 'healthy').length;

  return (
    <>
      <div style={{ marginBottom: 14, display: 'flex', gap: 8 }}>
        <StatBadge label={`${healthy}/${servers.length} online`} color="var(--accent-green)" />
        <StatBadge label={`${servers.length - healthy} offline`} color={servers.length - healthy > 0 ? 'var(--accent-red)' : 'var(--text-muted)'} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
        {servers.map(s => (
          <div key={s.name} style={{
            background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 10,
            padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {s.health === 'healthy'
              ? <CheckCircle2 size={13} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
              : <XCircle size={13} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
              {s.url && (
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.url}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Registry Tab ─────────────────────────────────────────────────────────────

function RegistryTab() {
  const [agents, setAgents] = useState<NocoAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/nocodb/agents', { headers: { ...dashboardApiAuthHeaders() } })
      .then(r => r.ok ? r.json() : [])
      .then(d => setAgents(Array.isArray(d) ? d : d?.list ?? []))
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState text="Lade Agent Registry…" />;

  const filtered = agents.filter(a =>
    !search || (a.Name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div style={{ marginBottom: 12, position: 'relative', maxWidth: 300 }}>
        <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          placeholder="Agent suchen…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', paddingLeft: 28, height: 32, borderRadius: 7,
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', fontSize: 12, outline: 'none',
          }}
        />
      </div>
      <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <thead>
            <tr style={{ background: 'var(--layer-2)', borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Name</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Typ</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Model</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 600 }}>Phase</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 16, textAlign: 'center', color: 'var(--text-muted)' }}>Keine Agents gefunden</td></tr>
            )}
            {filtered.map(a => (
              <tr key={a.Id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>{a.Name}</td>
                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{a.Typ ?? '—'}</td>
                <td style={{ padding: '8px 12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{a.Model ?? '—'}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: a.Status === 'active' ? 'rgba(52,211,153,0.12)' : 'rgba(148,163,184,0.12)',
                    color: a.Status === 'active' ? 'var(--accent-green)' : 'var(--text-muted)',
                  }}>
                    {a.Status ?? 'unknown'}
                  </span>
                </td>
                <td style={{ padding: '8px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{a.Phase ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ── API Explorer Tab ─────────────────────────────────────────────────────────

function ExplorerTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 40 }}>
      <Terminal size={40} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
      <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>API Explorer</p>
      <Link
        href="/api-explorer"
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8,
          background: 'var(--accent-blue)', color: 'white',
          fontSize: 12, fontWeight: 600, textDecoration: 'none',
        }}
      >
        Öffnen <ExternalLink size={11} />
      </Link>
    </div>
  );
}

// ── Advanced Panel (Index + Search, from original Fabrik) ─────────────────────

function AdvancedPanel() {
  const [indexTitle, setIndexTitle] = useState('');
  const [indexLoading, setIndexLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; score: number; title?: string }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  async function onIndex() {
    if (!indexTitle.trim()) return;
    setIndexLoading(true);
    try {
      const res = await fetch('/api/fabrik/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: indexTitle.trim() }),
      });
      if (res.ok) {
        toast.success('Indexiert', `"${indexTitle}" wurde in Qdrant + NocoDB gespeichert.`);
        setIndexTitle('');
      } else {
        toast.error('Fehler', 'Indexierung fehlgeschlagen');
      }
    } catch {
      toast.error('Fehler', 'Netzwerkfehler');
    } finally { setIndexLoading(false); }
  }

  async function onSearch() {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/fabrik/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      const data = await res.json();
      setSearchResults(data.hits ?? []);
    } catch {
      setSearchResults([]);
    } finally { setSearchLoading(false); }
  }

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <button
          className="flex w-full items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-[--layer-3]"
          style={{ color: 'var(--text-secondary)', background: 'var(--layer-2)', border: '1px solid var(--border)', marginTop: 16 }}
        >
          <ChevronRight size={12} className="transition-transform duration-200 [[data-state=open]_&]:rotate-90" />
          Advanced: Qdrant Index & Semantic Search
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          {/* Index */}
          <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Snapshot indexieren</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                placeholder="Projekttitel…"
                value={indexTitle}
                onChange={e => setIndexTitle(e.target.value)}
                style={{
                  flex: 1, height: 32, borderRadius: 6, paddingLeft: 10,
                  background: 'var(--layer-3)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                }}
              />
              <button
                onClick={onIndex}
                disabled={indexLoading}
                style={{
                  padding: '0 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'var(--accent-blue)', color: 'white', border: 'none', cursor: 'pointer',
                }}
              >
                {indexLoading ? '…' : 'Index'}
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>Semantic Search</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                placeholder="Suche in Qdrant…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSearch()}
                style={{
                  flex: 1, height: 32, borderRadius: 6, paddingLeft: 10,
                  background: 'var(--layer-3)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: 12, outline: 'none',
                }}
              />
              <button
                onClick={onSearch}
                disabled={searchLoading}
                style={{
                  padding: '0 14px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                  background: 'var(--accent-purple)', color: 'white', border: 'none', cursor: 'pointer',
                }}
              >
                {searchLoading ? '…' : 'Suche'}
              </button>
            </div>
            {searchResults.length > 0 && (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {searchResults.map(r => (
                  <div key={r.id} style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{r.title ?? r.id}</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{(r.score * 100).toFixed(0)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── Shared Components ────────────────────────────────────────────────────────

function LoadingState({ text }: { text: string }) {
  return <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>{text}</div>;
}

function EmptyState({ text }: { text: string }) {
  return <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>{text}</div>;
}

function StatBadge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
      background: color + '12', color, border: `1px solid ${color}25`,
    }}>
      {label}
    </span>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AgentEnginePage() {
  const [activeTab, setActiveTab] = useState<TabId>('deployments');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--layer-0)' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--layer-1)', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Cpu size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Agent Engine</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              Deployments · MCP · Registry · API
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 2, background: 'var(--layer-2)', borderRadius: 8, padding: 2 }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 6, fontSize: 11, fontWeight: active ? 600 : 400,
                  background: active ? 'var(--layer-1)' : 'transparent',
                  border: active ? '1px solid var(--border)' : '1px solid transparent',
                  color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.1s',
                }}
              >
                <Icon size={12} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {activeTab === 'deployments' && <DeploymentsTab />}
        {activeTab === 'mcp' && <MCPTab />}
        {activeTab === 'registry' && <RegistryTab />}
        {activeTab === 'explorer' && <ExplorerTab />}

        {/* Advanced: Qdrant Index + Search */}
        <AdvancedPanel />
      </div>
    </div>
  );
}
