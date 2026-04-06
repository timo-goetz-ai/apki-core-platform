'use client';

import { useEffect, useState, useCallback } from 'react';
import { CATEGORY_GROUPS, SCHEDULE_TAGS, type CategoryGroup } from '@/lib/workflow-categories';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface LiveWorkflow {
  id: string;
  name: string;
  displayName: string;
  active: boolean;
  updatedAt: string;
  nodeCount: number;
  tags: string[];
  chips: string[];
  newId: string;
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
  benefit: string;
  savesHoursPerWeek: number;
  cost: string;
  priority: string;
  directusStatus: string;
  inDevelopment: boolean;
  n8nUrl: string;
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
  stats: {
    total: number;
    active: number;
    inactive: number;
    errors: number;
    savesHoursPerWeek: number;
  };
  timestamp: string;
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

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

function costColor(cost: string): string {
  if (cost === 'kostenlos') return 'var(--accent-green)';
  if (cost === 'gering') return 'var(--accent-blue)';
  if (cost === 'mittel') return 'var(--accent-amber)';
  if (cost === 'hoch') return 'var(--accent-red)';
  return 'var(--text-muted)';
}

function priorityColor(p: string): string {
  if (p === 'kritisch') return 'var(--accent-red)';
  if (p === 'hoch') return 'var(--accent-amber)';
  if (p === 'mittel') return 'var(--accent-blue)';
  return 'var(--text-muted)';
}

/* ── Styles ───────────────────────────────────────────────────────────────── */

const S = {
  page:  { padding: '24px 28px 60px', background: 'var(--layer-0)', minHeight: '100vh', fontFamily: 'var(--font-ui)', color: 'var(--text-primary)' } as const,
  card:  { background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 } as const,
  label: { fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--text-muted)' } as const,
  mono:  { fontFamily: 'var(--font-mono)', fontSize: 13 } as const,
  btn:   { padding: '8px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)', transition: 'opacity 0.15s' } as const,
};

/* ── Chip component ───────────────────────────────────────────────────────── */
function Chip({ label }: { label: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '1px 7px',
      borderRadius: 10,
      fontSize: 10,
      fontFamily: 'var(--font-mono)',
      fontWeight: 500,
      background: 'var(--layer-0)',
      border: '1px solid var(--border)',
      color: 'var(--text-secondary)',
      letterSpacing: '0.02em',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function WorkflowsPage() {
  const [data, setData]             = useState<LiveData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['Core Operations', 'KI & Automatisierung', 'Kommunikation']),
  );
  const [expandedWf, setExpandedWf] = useState<Set<string>>(new Set());
  const [search, setSearch]         = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryMsg, setSummaryMsg]   = useState('');
  const [renameLoading, setRenameLoading] = useState(false);
  const [renameMsg, setRenameMsg]     = useState('');
  const [showRenameConfirm, setShowRenameConfirm] = useState(false);

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

  const toggleGroup = (label: string) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });

  const toggleWf = (id: string) =>
    setExpandedWf((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const sendSummary = async () => {
    setSummaryLoading(true);
    setSummaryMsg('');
    try {
      const res = await fetch('/api/n8n/summary', { method: 'POST' });
      const json = await res.json();
      setSummaryMsg(json.ok ? `✅ ${json.message}` : `❌ ${json.error ?? 'Fehler'}`);
    } catch {
      setSummaryMsg('❌ Verbindungsfehler');
    }
    setSummaryLoading(false);
    setTimeout(() => setSummaryMsg(''), 5000);
  };

  const executeRename = async () => {
    setShowRenameConfirm(false);
    setRenameLoading(true);
    setRenameMsg('');
    try {
      const res = await fetch('/api/n8n/rename-bulk', { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        const { renamed, failed } = json;
        setRenameMsg(`✅ ${renamed} umbenannt${failed > 0 ? ` · ⚠️ ${failed} Fehler` : ''}`);
        fetchData();
      } else {
        setRenameMsg(`❌ ${json.error ?? 'Fehler beim Umbenennen'}`);
      }
    } catch {
      setRenameMsg('❌ Verbindungsfehler');
    }
    setRenameLoading(false);
    setTimeout(() => setRenameMsg(''), 8000);
  };

  /* Filter */
  const filtered = data?.workflows.filter((wf) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      wf.name.toLowerCase().includes(q) ||
      wf.displayName.toLowerCase().includes(q) ||
      wf.newId.toLowerCase().includes(q) ||
      wf.categoryLabel.toLowerCase().includes(q) ||
      wf.description.toLowerCase().includes(q) ||
      wf.chips.some((c) => c.toLowerCase().includes(q))
    );
  }) ?? [];

  function getGroupWorkflows(group: CategoryGroup): LiveWorkflow[] {
    const catKeys = new Set(group.categories.map((c) => c.key));
    return filtered
      .filter((wf) => catKeys.has(wf.categoryKey))
      .sort((a, b) => (a.newId || a.name).localeCompare(b.newId || b.name));
  }

  const totalSaves = data?.stats.savesHoursPerWeek ?? 0;

  /* ── Render ─────────────────────────────────────────────────────────────── */
  return (
    <div style={S.page}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 20, fontWeight: 700 }}>Operations Center</span>

        {/* Live indicator */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'var(--layer-3)', border: '1px solid var(--border)' }}>
          <span className="ops-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: data ? 'var(--accent-green)' : 'var(--accent-red)' }} />
          <span style={S.label}>{loading ? 'LOADING' : 'LIVE'}</span>
        </span>

        <div style={{ flex: 1 }} />

        {/* Summary button */}
        <button
          onClick={sendSummary}
          disabled={summaryLoading}
          style={{ ...S.btn, background: 'var(--layer-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)', opacity: summaryLoading ? 0.6 : 1 }}
        >
          {summaryLoading ? '⏳ Sende...' : '📤 Summary senden'}
        </button>

        {/* Rename button */}
        <button
          onClick={() => setShowRenameConfirm(true)}
          disabled={renameLoading}
          style={{ ...S.btn, background: 'var(--layer-3)', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber)', opacity: renameLoading ? 0.6 : 1 }}
          title="Workflows in n8n auf neues Schema umbenennen"
        >
          {renameLoading ? '⏳ Umbenennen...' : '✏️ n8n umbenennen'}
        </button>

        {/* Search */}
        <input
          type="text"
          placeholder="Suchen…  z.B. #täglich  AI  telegram"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 260, padding: '6px 12px', background: 'var(--layer-3)', border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none' }}
        />

        <button
          onClick={fetchData}
          style={{ ...S.btn, background: 'var(--layer-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          ↺
        </button>

        {lastUpdated && (
          <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-muted)' }}>
            {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {/* Summary feedback */}
      {summaryMsg && (
        <div style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 6, background: 'var(--layer-2)', border: '1px solid var(--border)', ...S.mono, fontSize: 13 }}>
          {summaryMsg}
        </div>
      )}

      {/* Rename feedback */}
      {renameMsg && (
        <div style={{ marginBottom: 12, padding: '8px 14px', borderRadius: 6, background: 'var(--layer-2)', border: '1px solid var(--accent-amber)', ...S.mono, fontSize: 13 }}>
          {renameMsg}
        </div>
      )}

      {/* Rename confirm modal */}
      {showRenameConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 10, padding: 24, maxWidth: 420, width: '90%' }}>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>✏️ n8n Workflows umbenennen</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Alle <strong>25 Workflows</strong> werden in n8n auf das neue Schema umbenannt:<br />
              <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-blue)' }}>17_020_AI — Trend Monitor</code><br /><br />
              Webhook-URLs bleiben unverändert. Einmalige Aktion.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowRenameConfirm(false)} style={{ ...S.btn, background: 'var(--layer-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Abbrechen
              </button>
              <button onClick={executeRename} style={{ ...S.btn, background: 'var(--accent-amber)', color: '#000', border: 'none' }}>
                Jetzt umbenennen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      {data && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Gesamt',      value: data.stats.total,    color: 'var(--text-primary)', suffix: '' },
            { label: 'Aktiv',       value: data.stats.active,   color: 'var(--accent-green)', suffix: '' },
            { label: 'Inaktiv',     value: data.stats.inactive, color: 'var(--text-muted)',   suffix: '' },
            { label: 'Fehler 24h',  value: data.stats.errors,   color: data.stats.errors > 0 ? 'var(--accent-red)' : 'var(--text-muted)', suffix: '' },
            { label: 'Spart/Woche', value: totalSaves,          color: 'var(--accent-green)', suffix: 'h' },
          ].map((s) => (
            <div key={s.label} style={{ ...S.card, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, minWidth: 110 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: s.color }}>
                {s.value}{s.suffix}
              </span>
              <span style={S.label}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Category Groups ────────────────────────────────────────────────── */}
      {CATEGORY_GROUPS.map((group) => {
        const wfs        = getGroupWorkflows(group);
        const activeCount = wfs.filter((w) => w.active).length;
        const isExpanded  = expandedGroups.has(group.label);
        // only show groups that have at least one workflow (or all when searching)
        if (!search && wfs.length === 0) return null;

        return (
          <div key={group.label} style={{ marginBottom: 10 }}>

            {/* Group header */}
            <button
              onClick={() => toggleGroup(group.label)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '10px 14px',
                background: isExpanded ? 'var(--layer-2)' : 'var(--layer-1)',
                border: '1px solid var(--border)',
                borderRadius: isExpanded ? '8px 8px 0 0' : 8,
                cursor: 'pointer', color: 'var(--text-primary)',
                fontFamily: 'var(--font-ui)', fontSize: 13, fontWeight: 600,
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 14 }}>{group.emoji}</span>
              <span style={{ color: group.color }}>{group.label}</span>

              {/* Category pills */}
              <div style={{ display: 'flex', gap: 4, marginLeft: 6, flexWrap: 'wrap' }}>
                {group.categories.map((cat) => {
                  const count = filtered.filter((w) => w.categoryKey === cat.key).length;
                  if (count === 0) return null;
                  return (
                    <span key={cat.key} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 8, background: 'var(--layer-0)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      {cat.emoji} {cat.key} {count}
                    </span>
                  );
                })}
              </div>

              {/* Status dots */}
              <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
                {wfs.slice(0, 14).map((wf) => (
                  <span key={wf.id} style={{ width: 6, height: 6, borderRadius: '50%', background: wf.active ? 'var(--accent-green)' : 'var(--text-muted)', flexShrink: 0 }} title={wf.displayName} />
                ))}
              </div>

              <div style={{ flex: 1 }} />

              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-green)', marginRight: 8 }}>
                {activeCount}/{wfs.length}
              </span>

              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>

                {wfs.length === 0 && (
                  <div style={{ padding: '14px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12, textAlign: 'center' }}>
                    Keine Workflows in dieser Gruppe
                  </div>
                )}

                {wfs.map((wf, idx) => {
                  const isWfExpanded = expandedWf.has(wf.id);
                  const isLast = idx === wfs.length - 1;

                  return (
                    <div key={wf.id}>
                      {/* Main row */}
                      <div
                        onClick={() => toggleWf(wf.id)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '10px 110px 1fr auto auto 32px',
                          gap: 8,
                          padding: '9px 14px',
                          borderBottom: isLast && !isWfExpanded ? 'none' : '1px solid var(--border)',
                          cursor: 'pointer',
                          alignItems: 'start',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--layer-2)'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        {/* Status dot */}
                        <span style={{ display: 'flex', alignItems: 'center', paddingTop: 3 }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: wf.active ? 'var(--accent-green)' : 'var(--text-muted)', flexShrink: 0 }} />
                        </span>

                        {/* Schema ID */}
                        <span style={{
                          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                          color: wf.newId ? 'var(--accent-blue)' : 'var(--text-muted)',
                          paddingTop: 2, letterSpacing: '0.03em',
                        }}>
                          {wf.newId || '—'}
                        </span>

                        {/* Name + chips + description */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                              {wf.categoryEmoji} {wf.displayName || wf.name}
                            </span>

                            {/* Cost badge */}
                            {wf.cost && (
                              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 8, background: 'var(--layer-0)', border: `1px solid ${costColor(wf.cost)}`, color: costColor(wf.cost) }}>
                                {wf.cost}
                              </span>
                            )}

                            {/* Priority badge */}
                            {wf.priority && wf.priority !== 'mittel' && (
                              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 8, background: 'var(--layer-0)', border: `1px solid ${priorityColor(wf.priority)}`, color: priorityColor(wf.priority) }}>
                                {wf.priority}
                              </span>
                            )}

                            {/* In-Development badge */}
                            {wf.inDevelopment && (
                              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '1px 8px', borderRadius: 8, background: 'rgba(251,191,36,0.12)', border: '1px solid var(--accent-amber)', color: 'var(--accent-amber)', fontWeight: 600 }}>
                                🔧 In Entwicklung
                              </span>
                            )}
                          </div>

                          {/* Chips */}
                          {wf.chips.length > 0 && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                              {wf.chips.map((c) => <Chip key={c} label={c} />)}
                            </div>
                          )}

                          {/* Short description (only if not expanded) */}
                          {!isWfExpanded && wf.description && (
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 520 }}>
                              {wf.description}
                            </div>
                          )}
                        </div>

                        {/* Schedule */}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: wf.scheduleColor, whiteSpace: 'nowrap', paddingTop: 2 }}>
                          {wf.scheduleIcon} {wf.scheduleTag}
                          {wf.schedule && wf.schedule !== 'on_demand' && (
                            <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>{wf.schedule}</span>
                          )}
                        </span>

                        {/* Time savings */}
                        {wf.savesHoursPerWeek > 0 && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-green)', whiteSpace: 'nowrap', paddingTop: 3 }}>
                            ⏱ -{wf.savesHoursPerWeek}h/Wo
                          </span>
                        )}

                        {/* n8n link */}
                        <a
                          href={wf.n8nUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ color: 'var(--accent-blue)', textDecoration: 'none', paddingTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="In n8n öffnen"
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" x2="21" y1="14" y2="3" />
                          </svg>
                        </a>
                      </div>

                      {/* Expanded detail row */}
                      {isWfExpanded && (
                        <div style={{
                          padding: '10px 14px 14px 132px',
                          borderBottom: isLast ? 'none' : '1px solid var(--border)',
                          background: 'var(--layer-2)',
                        }}>
                          {wf.description && (
                            <div style={{ marginBottom: 6 }}>
                              <span style={{ ...S.label, marginRight: 8 }}>Was</span>
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{wf.description}</span>
                            </div>
                          )}
                          {wf.benefit && (
                            <div style={{ marginBottom: 6 }}>
                              <span style={{ ...S.label, marginRight: 8 }}>Nutzen</span>
                              <span style={{ fontSize: 12, color: 'var(--accent-green)' }}>{wf.benefit}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
                            <div>
                              <span style={S.label}>n8n ID</span>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{wf.id}</div>
                            </div>
                            <div>
                              <span style={S.label}>Nodes</span>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{wf.nodeCount}</div>
                            </div>
                            <div>
                              <span style={S.label}>Zuletzt</span>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{fmtDate(wf.updatedAt)}</div>
                            </div>
                            {wf.savesHoursPerWeek > 0 && (
                              <div>
                                <span style={S.label}>Zeitersparnis</span>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-green)', marginTop: 2 }}>
                                  ~{wf.savesHoursPerWeek}h/Woche · ~{(wf.savesHoursPerWeek * 4).toFixed(0)}h/Monat
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* ── Unkategorisiert (in n8n aber nicht im Catalog) ─────────────────── */}
      {(() => {
        const uncategorized = filtered.filter((wf) => !wf.newId);
        if (uncategorized.length === 0) return null;
        return (
          <div style={{ marginTop: 10, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <span style={{ fontSize: 14 }}>❓</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>Unkategorisiert</span>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '1px 6px', borderRadius: 8, background: 'var(--layer-0)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                {uncategorized.length} Workflow{uncategorized.length !== 1 ? 's' : ''} — nicht im Catalog
              </span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginLeft: 4 }}>
                Füge diese in WORKFLOW_CATALOG ein oder entferne sie in n8n
              </span>
            </div>
            <div style={{ background: 'var(--layer-1)', border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
              {uncategorized.map((wf, idx) => (
                <div key={wf.id} style={{ display: 'grid', gridTemplateColumns: '10px 1fr auto 32px', gap: 8, padding: '8px 14px', borderBottom: idx < uncategorized.length - 1 ? '1px solid var(--border)' : 'none', alignItems: 'center' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: wf.active ? 'var(--accent-green)' : 'var(--text-muted)' }} />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>{wf.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginLeft: 8 }}>{wf.id}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                    {wf.active ? '✅ aktiv' : '⚪ inaktiv'}
                  </span>
                  <a href={wf.n8nUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" x2="21" y1="14" y2="3" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── Recent Executions ─────────────────────────────────────────────── */}
      {data && data.executions.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ ...S.label, marginBottom: 8 }}>Letzte Ausführungen</div>
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px 70px', gap: 4, padding: '7px 14px', borderBottom: '1px solid var(--border)' }}>
              {['Zeit', 'Workflow', 'Status', 'Dauer'].map((h) => (
                <span key={h} style={S.label}>{h}</span>
              ))}
            </div>
            {data.executions.slice(0, 15).map((exec) => (
              <div key={exec.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 90px 70px', gap: 4, padding: '7px 14px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-muted)' }}>{fmtTime(exec.startedAt)}</span>
                <span style={{ ...S.mono, fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {exec.workflowName}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor(exec.status), flexShrink: 0 }} />
                  <span style={{ ...S.mono, fontSize: 11, color: statusColor(exec.status) }}>{exec.status}</span>
                </span>
                <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-muted)' }}>
                  {exec.stoppedAt ? durationStr(exec.startedAt, exec.stoppedAt) : '…'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Schedule Legend ───────────────────────────────────────────────── */}
      <div style={{ marginTop: 28 }}>
        <div style={{ ...S.label, marginBottom: 8 }}>Zeitplan-Legende</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.values(SCHEDULE_TAGS).map((tag) => (
            <span key={tag.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 6, background: 'var(--layer-2)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 12 }}>{tag.icon}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: tag.color }}>{tag.key}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{tag.label}</span>
            </span>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ops-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .ops-pulse { animation: ops-pulse 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
