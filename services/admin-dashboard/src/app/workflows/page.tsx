'use client';

import { useEffect, useState, useCallback } from 'react';
import { CATEGORY_GROUPS, SCHEDULE_TAGS, type CategoryGroup } from '@/lib/workflow-categories';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface LiveWorkflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  nodeCount: number;
  tags: string[];
  categoryKey: string;
  categoryNr: number;
  categoryLabel: string;
  categoryEmoji: string;
  scheduleTag: string;
  scheduleLabel: string;
  scheduleIcon: string;
  scheduleColor: string;
  schedule: string;
  description: string;
}

interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: string;
  startedAt: string;
  stoppedAt: string | null;
}

interface LiveData {
  workflows: LiveWorkflow[];
  executions: Execution[];
  stats: { total: number; active: number; inactive: number; errors: number };
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const N8N_BASE = 'https://n8n.automation-plus-ki.de';

function fmtTime(iso: string): string {
  try { return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
  catch { return iso; }
}

function fmtDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

function durationStr(start: string, stop?: string | null): string {
  const s = new Date(start).getTime();
  const e = stop ? new Date(stop).getTime() : Date.now();
  const ms = e - s;
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function statusColor(s: string): string {
  if (s === 'success') return 'var(--accent-green)';
  if (s === 'error' || s === 'failed') return 'var(--accent-red)';
  if (s === 'running' || s === 'waiting') return 'var(--accent-blue)';
  return 'var(--text-muted)';
}

/* ── Styles ───────────────────────────────────────────────────────────────── */

const S = {
  page: { padding: '24px 28px 48px', background: 'var(--layer-0)', minHeight: '100vh', fontFamily: 'var(--font-ui)', color: 'var(--text-primary)' } as const,
  card: { background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 } as const,
  label: { fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--text-muted)' } as const,
  mono: { fontFamily: 'var(--font-mono)', fontSize: 13 } as const,
  btn: { padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)', transition: 'opacity 0.15s' } as const,
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function WorkflowsPage() {
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Core Operations', 'KI & Automatisierung']));
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/n8n/live');
      if (!res.ok) return;
      const d: LiveData = await res.json();
      setData(d);
      setLastUpdated(new Date());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

  /* Filter workflows */
  const filtered = data?.workflows.filter((wf) =>
    !search || wf.name.toLowerCase().includes(search.toLowerCase()) || wf.categoryLabel.toLowerCase().includes(search.toLowerCase()),
  ) ?? [];

  /* Group workflows by category group */
  function getGroupWorkflows(group: CategoryGroup): LiveWorkflow[] {
    const catKeys = new Set(group.categories.map((c) => c.key));
    return filtered.filter((wf) => catKeys.has(wf.categoryKey)).sort((a, b) => a.categoryNr - b.categoryNr || a.name.localeCompare(b.name));
  }

  /* ── Render ──────────────────────────────────────────────────────────────── */

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 22, fontWeight: 600 }}>Operations Center</span>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8, padding: '3px 10px', borderRadius: 20, background: 'var(--layer-3)', border: '1px solid var(--border)' }}>
          <span className="ops-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: data ? 'var(--accent-green)' : 'var(--accent-red)' }} />
          <span style={{ ...S.label }}>{loading ? 'LOADING' : 'LIVE'}</span>
        </span>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <input
          type="text" placeholder="Suchen..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          style={{ width: 200, padding: '6px 12px', background: 'var(--layer-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none' }}
        />

        <button onClick={fetchData} style={{ ...S.btn, background: 'var(--layer-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          Refresh
        </button>
        {lastUpdated && (
          <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-muted)' }}>
            {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {/* Stats Bar */}
      {data && (
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Gesamt', value: data.stats.total, color: 'var(--text-primary)' },
            { label: 'Aktiv', value: data.stats.active, color: 'var(--accent-green)' },
            { label: 'Inaktiv', value: data.stats.inactive, color: 'var(--text-muted)' },
            { label: 'Fehler (24h)', value: data.stats.errors, color: data.stats.errors > 0 ? 'var(--accent-red)' : 'var(--text-muted)' },
          ].map((s) => (
            <div key={s.label} style={{ ...S.card, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, fontWeight: 600, color: s.color }}>{s.value}</span>
              <span style={S.label}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Category Groups */}
      {CATEGORY_GROUPS.map((group) => {
        const wfs = getGroupWorkflows(group);
        const activeCount = wfs.filter((w) => w.active).length;
        const isExpanded = expandedGroups.has(group.label);

        return (
          <div key={group.label} style={{ marginBottom: 12 }}>
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.label)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '10px 12px', background: 'var(--layer-1)', border: '1px solid var(--border)',
                borderRadius: isExpanded ? '8px 8px 0 0' : 8, cursor: 'pointer',
                color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--layer-2)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--layer-1)'; }}
            >
              <span style={{ fontSize: 14 }}>{group.emoji}</span>
              <span>{group.label}</span>
              <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-muted)', marginLeft: 4 }}>
                {wfs.length} Workflows
              </span>

              {/* Status dots */}
              <div style={{ display: 'flex', gap: 3, marginLeft: 8 }}>
                {wfs.slice(0, 12).map((wf) => (
                  <span key={wf.id} style={{ width: 6, height: 6, borderRadius: '50%', background: wf.active ? 'var(--accent-green)' : 'var(--text-muted)' }} title={wf.name} />
                ))}
                {wfs.length > 12 && <span style={{ ...S.mono, fontSize: 9, color: 'var(--text-muted)' }}>+{wfs.length - 12}</span>}
              </div>

              <div style={{ flex: 1 }} />

              <span style={{ ...S.mono, fontSize: 11, color: 'var(--accent-green)' }}>
                {activeCount}/{wfs.length}
              </span>

              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            {/* Expanded Content */}
            {isExpanded && wfs.length > 0 && (
              <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                {/* Table Header */}
                <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 100px 60px 40px', gap: 4, padding: '6px 12px', borderBottom: '1px solid var(--border)' }}>
                  <span style={S.label}></span>
                  <span style={S.label}>Workflow</span>
                  <span style={S.label}>Zeitplan</span>
                  <span style={S.label}>Aktualisiert</span>
                  <span style={S.label}>Nodes</span>
                  <span style={S.label}>n8n</span>
                </div>

                {wfs.map((wf) => (
                  <div
                    key={wf.id}
                    style={{ display: 'grid', gridTemplateColumns: '32px 1fr 100px 100px 60px 40px', gap: 4, padding: '8px 12px', borderBottom: '1px solid var(--border)', transition: 'background 0.1s', alignItems: 'center' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--layer-1)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                  >
                    {/* Status dot */}
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: wf.active ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                    </span>

                    {/* Name + Category */}
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{wf.categoryEmoji} {wf.name}</span>
                      {wf.description && (
                        <div style={{ ...S.mono, fontSize: 11, color: 'var(--text-muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {wf.description}
                        </div>
                      )}
                    </div>

                    {/* Schedule */}
                    <span style={{ ...S.mono, fontSize: 11, color: wf.scheduleColor }}>
                      {wf.scheduleIcon} {wf.scheduleTag}
                      {wf.schedule && <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{wf.schedule}</span>}
                    </span>

                    {/* Updated */}
                    <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-muted)' }}>
                      {fmtDate(wf.updatedAt)}
                    </span>

                    {/* Node count */}
                    <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>
                      {wf.nodeCount}
                    </span>

                    {/* n8n link */}
                    <a
                      href={`${N8N_BASE}/workflow/${wf.id}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ color: 'var(--accent-blue)', textDecoration: 'none', fontSize: 12, textAlign: 'center' }}
                      title="In n8n offnen"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                        <polyline points="15 3 21 3 21 9" />
                        <line x1="10" x2="21" y1="14" y2="3" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            )}

            {isExpanded && wfs.length === 0 && (
              <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: 16, textAlign: 'center', color: 'var(--text-muted)', ...S.mono, fontSize: 12 }}>
                Keine Workflows in dieser Kategorie
              </div>
            )}
          </div>
        );
      })}

      {/* Recent Executions */}
      {data && data.executions.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={S.label}>Letzte Ausfuhrungen</div>
          <div style={{ ...S.card, marginTop: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 80px 70px', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
              {['Zeit', 'Workflow', 'Status', 'Dauer'].map((h) => (
                <span key={h} style={S.label}>{h}</span>
              ))}
            </div>

            {data.executions.slice(0, 15).map((exec) => (
              <div key={exec.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 80px 70px', gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-muted)' }}>{fmtTime(exec.startedAt)}</span>
                <span style={{ ...S.mono, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exec.workflowName}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(exec.status) }} />
                  <span style={{ ...S.mono, fontSize: 11, color: statusColor(exec.status) }}>{exec.status}</span>
                </span>
                <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-muted)' }}>
                  {exec.stoppedAt ? durationStr(exec.startedAt, exec.stoppedAt) : '...'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pulse animation + Schedule tag legend */}
      <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {Object.values(SCHEDULE_TAGS).map((tag) => (
          <span key={tag.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, background: 'var(--layer-2)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12 }}>{tag.icon}</span>
            <span style={{ ...S.mono, fontSize: 10, color: tag.color }}>{tag.key}</span>
            <span style={{ ...S.mono, fontSize: 10, color: 'var(--text-muted)' }}>{tag.label}</span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes ops-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ops-pulse { animation: ops-pulse 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
