'use client';

import { useEffect, useState, useCallback } from 'react';
import { ExternalLink, Search, RefreshCw, X, Clock, Zap, Download, CalendarDays, LayoutGrid } from 'lucide-react';
import { exportCsv } from '@/lib/csv-export';

// ─── Config ──────────────────────────────────────────────────────────────────
const WORKFLOWS_TABLE = 'mnwlsxsm0q1k2d2';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Workflow {
  Id: number;
  n8n_id: string;
  Name: string;
  Status: string;
  Kategorie: string;
  Zweck: string;
  Trigger: string;
  Integrationen: string;
  Kosten: string;
  Laufzeit_Sek: number;
  Intervall: string;
  Output: string;
  Verknuepfungen: string;
  Prioritaet: string;
  Notizen: string;
  n8n_url: string;
}

// ─── Color maps ───────────────────────────────────────────────────────────────
const KATEGORIE_COLORS: Record<string, string> = {
  System:      '#38bdf8',
  'KI-Chat':   '#a78bfa',
  'Job-Scout': '#34d399',
  Content:     '#fb923c',
  Voice:       '#f472b6',
  SaaS:        '#fbbf24',
  DevOps:      '#94a3b8',
  Daten:       '#60a5fa',
};

const KOSTEN_COLORS: Record<string, string> = {
  kostenlos: '#34d399',
  gering:    '#fbbf24',
  mittel:    '#fb923c',
  hoch:      '#f87171',
};

const PRIORITAET_COLORS: Record<string, string> = {
  kritisch: '#f87171',
  hoch:     '#fb923c',
  mittel:   '#fbbf24',
  niedrig:  '#6b7280',
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; dot: string }> = {
  aktiv:          { color: '#34d399', bg: 'rgba(52,211,153,0.12)', dot: '#34d399' },
  inaktiv:        { color: '#6b7280', bg: 'rgba(107,114,128,0.12)', dot: '#6b7280' },
  in_entwicklung: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', dot: '#fbbf24' },
  archiviert:     { color: '#f87171', bg: 'rgba(248,113,113,0.12)', dot: '#f87171' },
};

const KATEGORIEN = ['Alle', 'System', 'KI-Chat', 'Job-Scout', 'Content', 'Voice', 'SaaS', 'DevOps', 'Daten'];

// ─── Pipeline visualizer data ────────────────────────────────────────────────
const PIPELINES = [
  {
    name: 'Job-Scout Pipeline',
    color: '#34d399',
    steps: ['10_JOB_SCOUT', '07_BEWERBUNGS_KREATOR', 'Telegram'],
  },
  {
    name: 'Content Pipeline',
    color: '#fb923c',
    steps: ['Complete Content Pipeline', '11_CONTENT_ENRICHMENT', '12_APPLY_TEMPLATE', '06_TTS_FISH_AUDIO'],
  },
  {
    name: 'SaaS Pipeline',
    color: '#fbbf24',
    steps: ['01_NISCHEN_SCANNER', '09_NISCHE_AKTIVIERT', '03_LEAD_CAPTURE'],
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function Pill({ label, color, bg }: { label: string; color: string; bg?: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 20,
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.03em',
      color,
      background: bg ?? `${color}1a`,
      border: `1px solid ${color}33`,
      whiteSpace: 'nowrap',
    }}>
      {label}
    </span>
  );
}

function Tag({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: 6,
      fontSize: 11,
      color,
      background: `${color}1a`,
      border: `1px solid ${color}33`,
    }}>
      {label}
    </span>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ wf, onClose }: { wf: Workflow; onClose: () => void }) {
  const statusCfg = STATUS_CONFIG[wf.Status] ?? STATUS_CONFIG.inaktiv;
  const katColor = KATEGORIE_COLORS[wf.Kategorie] ?? '#94a3b8';
  const integrations = (wf.Integrationen ?? '').split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      bottom: 0,
      width: 420,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--layer-1)',
      borderLeft: '1px solid var(--border)',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
      animation: 'slideIn 0.18s ease',
    }}>
      <style>{`@keyframes slideIn { from { transform: translateX(30px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        flexShrink: 0,
      }}>
        <div style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: statusCfg.dot,
          flexShrink: 0,
          marginTop: 4,
          boxShadow: `0 0 6px ${statusCfg.dot}`,
        }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', wordBreak: 'break-all' }}>
            {wf.Name}
          </h2>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            <Pill label={wf.Status} color={statusCfg.color} />
            <Pill label={wf.Kategorie} color={katColor} />
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: 4,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Zweck */}
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Zweck</p>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{wf.Zweck}</p>
        </div>

        {/* Meta grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { label: 'Trigger',   value: wf.Trigger,   color: '#38bdf8' },
            { label: 'Kosten',    value: wf.Kosten,    color: KOSTEN_COLORS[wf.Kosten] },
            { label: 'Priorität', value: wf.Prioritaet, color: PRIORITAET_COLORS[wf.Prioritaet] },
            { label: 'Intervall', value: wf.Intervall, color: '#94a3b8' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'var(--layer-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '8px 10px',
            }}>
              <p style={{ margin: '0 0 3px', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</p>
              <span style={{ fontSize: 12, fontWeight: 600, color: color ?? 'var(--text-primary)' }}>{value ?? '—'}</span>
            </div>
          ))}
        </div>

        {/* Laufzeit */}
        {wf.Laufzeit_Sek != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Laufzeit: <strong style={{ color: 'var(--text-primary)' }}>{wf.Laufzeit_Sek}s</strong></span>
          </div>
        )}

        {/* Integrationen */}
        {integrations.length > 0 && (
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Integrationen</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {integrations.map(i => (
                <Tag key={i} label={i} color={KATEGORIE_COLORS[i] ?? '#94a3b8'} />
              ))}
            </div>
          </div>
        )}

        {/* Output */}
        {wf.Output && (
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Output</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{wf.Output}</p>
          </div>
        )}

        {/* Verknüpfungen */}
        {wf.Verknuepfungen && (
          <div>
            <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Verknüpfungen</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{wf.Verknuepfungen}</p>
          </div>
        )}

        {/* Notizen */}
        {wf.Notizen && (
          <div style={{
            background: 'rgba(251,191,36,0.06)',
            border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: 8,
            padding: '10px 12px',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#fbbf24' }}>Notizen</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{wf.Notizen}</p>
          </div>
        )}

        {/* n8n ID */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          ID: {wf.n8n_id}
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <a
          href={wf.n8n_url || `https://n8n.automation-plus-ki.de/workflow/${wf.n8n_id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 16px',
            borderRadius: 8,
            background: 'rgba(56,189,248,0.1)',
            border: '1px solid rgba(56,189,248,0.3)',
            color: '#38bdf8',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.18)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(56,189,248,0.1)')}
        >
          In n8n öffnen
          <ExternalLink size={13} />
        </a>
      </div>
    </div>
  );
}

// ─── Workflow Card ────────────────────────────────────────────────────────────
function WorkflowCard({ wf, isSelected, onClick }: { wf: Workflow; isSelected: boolean; onClick: () => void }) {
  const statusCfg = STATUS_CONFIG[wf.Status] ?? STATUS_CONFIG.inaktiv;
  const katColor = KATEGORIE_COLORS[wf.Kategorie] ?? '#94a3b8';

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? 'rgba(56,189,248,0.06)' : 'var(--layer-2)',
        border: `1px solid ${isSelected ? 'rgba(56,189,248,0.35)' : 'var(--border)'}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
      onMouseEnter={e => {
        if (!isSelected) {
          (e.currentTarget as HTMLDivElement).style.border = '1px solid rgba(56,189,248,0.2)';
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(56,189,248,0.03)';
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          (e.currentTarget as HTMLDivElement).style.border = '1px solid var(--border)';
          (e.currentTarget as HTMLDivElement).style.background = 'var(--layer-2)';
        }
      }}
    >
      {/* Top row: status dot + name + kategorie */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: statusCfg.dot,
          flexShrink: 0,
          boxShadow: wf.Status === 'aktiv' ? `0 0 5px ${statusCfg.dot}80` : 'none',
        }} />
        <span style={{
          flex: 1,
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-primary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {wf.Name}
        </span>
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: 20,
          color: katColor,
          background: `${katColor}1a`,
          border: `1px solid ${katColor}33`,
          flexShrink: 0,
        }}>
          {wf.Kategorie}
        </span>
      </div>

      {/* Zweck */}
      <p style={{
        margin: 0,
        fontSize: 11,
        color: 'var(--text-secondary)',
        lineHeight: 1.55,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {wf.Zweck}
      </p>

      {/* Bottom pills */}
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
        {wf.Trigger && (
          <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, color: '#38bdf8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
            {wf.Trigger}
          </span>
        )}
        {wf.Kosten && (
          <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, color: KOSTEN_COLORS[wf.Kosten] ?? '#94a3b8', background: `${KOSTEN_COLORS[wf.Kosten] ?? '#94a3b8'}1a`, border: `1px solid ${KOSTEN_COLORS[wf.Kosten] ?? '#94a3b8'}33` }}>
            {wf.Kosten}
          </span>
        )}
        {wf.Prioritaet && (
          <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 20, color: PRIORITAET_COLORS[wf.Prioritaet] ?? '#94a3b8', background: `${PRIORITAET_COLORS[wf.Prioritaet] ?? '#94a3b8'}1a`, border: `1px solid ${PRIORITAET_COLORS[wf.Prioritaet] ?? '#94a3b8'}33` }}>
            {wf.Prioritaet}
          </span>
        )}
        <a
          href={wf.n8n_url || `https://n8n.automation-plus-ki.de/workflow/${wf.n8n_id}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            color: 'var(--text-muted)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#38bdf8')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          n8n <ExternalLink size={9} />
        </a>
      </div>
    </div>
  );
}

// ─── Pipeline Visualizer ──────────────────────────────────────────────────────
function PipelineVisualizer() {
  return (
    <div style={{
      marginTop: 32,
      padding: '20px 0',
      borderTop: '1px solid var(--border)',
    }}>
      <h3 style={{ margin: '0 0 16px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
        Haupt-Pipelines
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {PIPELINES.map(pipeline => (
          <div key={pipeline.name}>
            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: pipeline.color }}>{pipeline.name}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              {pipeline.steps.map((step, i) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    color: pipeline.color,
                    background: `${pipeline.color}15`,
                    border: `1px solid ${pipeline.color}30`,
                    whiteSpace: 'nowrap',
                  }}>
                    {step}
                  </span>
                  {i < pipeline.steps.length - 1 && (
                    <span style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 300 }}>→</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Schedule Parser ─────────────────────────────────────────────────────────
// Returns array of {day: 0-6 (Mo-So), hour: 0-23} for a workflow schedule string.
// day=-1 means every day.
function parseSchedule(wf: Workflow): { day: number; hour: number; label: string }[] {
  const intervall = (wf.Intervall ?? '').toLowerCase();
  const trigger   = (wf.Trigger   ?? '').toLowerCase();

  if (!intervall && trigger !== 'schedule' && trigger !== 'cron') return [];

  // "alle Xh" / "every Xh" → spread across day
  const everyH = intervall.match(/alle\s*(\d+)\s*h/);
  if (everyH) {
    const step = parseInt(everyH[1]);
    const slots: { day: number; hour: number; label: string }[] = [];
    for (let h = 0; h < 24; h += step) {
      slots.push({ day: -1, hour: h, label: `alle ${step}h` });
    }
    return slots;
  }

  // "täglich HH:mm" or just "HH:mm"
  const timeMatch = intervall.match(/(\d{1,2}):(\d{2})/);
  const hour = timeMatch ? parseInt(timeMatch[1]) : 8;

  const DAY_MAP: Record<string, number> = {
    mo: 0, di: 1, mi: 2, do: 3, fr: 4, sa: 5, so: 6,
    mon: 0, tue: 1, wed: 2, thu: 3, fri: 4, sat: 5, sun: 6,
  };

  // "wöchentlich mo" / "weekly mon"
  for (const [key, idx] of Object.entries(DAY_MAP)) {
    if (intervall.includes(key)) {
      return [{ day: idx, hour, label: intervall }];
    }
  }

  // "täglich" / "daily" / "jede nacht" / just a time
  if (
    intervall.includes('täglich') || intervall.includes('daily') ||
    intervall.includes('nacht') || intervall.includes('night') ||
    timeMatch
  ) {
    return [{ day: -1, hour, label: intervall || `${hour}:00` }];
  }

  return [];
}

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const HOURS = [0, 2, 4, 6, 7, 8, 9, 10, 12, 14, 16, 18, 20, 22];

function ScheduleView({ workflows }: { workflows: Workflow[] }) {
  // Build grid: day(0-6) × hour → workflows[]
  const grid: Record<string, Workflow[]> = {};

  for (const wf of workflows) {
    if (wf.Status !== 'aktiv') continue;
    const slots = parseSchedule(wf);
    for (const slot of slots) {
      const days = slot.day === -1 ? [0,1,2,3,4,5,6] : [slot.day];
      for (const d of days) {
        const key = `${d}-${slot.hour}`;
        if (!grid[key]) grid[key] = [];
        grid[key].push(wf);
      }
    }
  }

  const hasAny = Object.keys(grid).length > 0;

  return (
    <div style={{ marginTop: 8 }}>
      {!hasAny ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Keine Schedules gefunden — nur aktive Workflows mit Intervall-Feld werden angezeigt.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                <th style={{ width: 42, padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  Uhr
                </th>
                {DAYS.map(d => (
                  <th key={d} style={{ padding: '6px 8px', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HOURS.map(h => (
                <tr key={h} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '4px 8px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, whiteSpace: 'nowrap', verticalAlign: 'top' }}>
                    {String(h).padStart(2, '0')}:00
                  </td>
                  {DAYS.map((_, di) => {
                    const key = `${di}-${h}`;
                    const wfs = grid[key] ?? [];
                    return (
                      <td key={di} style={{ padding: '3px 4px', verticalAlign: 'top', minWidth: 90 }}>
                        {wfs.map(wf => {
                          const color = KATEGORIE_COLORS[wf.Kategorie] ?? '#94a3b8';
                          return (
                            <div key={wf.Id} title={wf.Zweck} style={{
                              marginBottom: 2,
                              padding: '2px 7px',
                              borderRadius: 5,
                              fontSize: 10,
                              fontWeight: 500,
                              color,
                              background: `${color}18`,
                              border: `1px solid ${color}30`,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: 130,
                            }}>
                              {wf.Name}
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Legend */}
          <div style={{ marginTop: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(KATEGORIE_COLORS).map(([kat, color]) => (
              workflows.some(w => w.Kategorie === kat && w.Status === 'aktiv' && parseSchedule(w).length > 0) ? (
                <div key={kat} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: `${color}30`, border: `1px solid ${color}50`, display: 'inline-block' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{kat}</span>
                </div>
              ) : null
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Workflow | null>(null);
  const [activeKategorie, setActiveKategorie] = useState('Alle');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'cards' | 'calendar'>('cards');

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/nocodb/table?id=${WORKFLOWS_TABLE}&limit=100`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const list: Workflow[] = Array.isArray(data) ? data : (data.list ?? []);
      setWorkflows(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  // Filter
  const filtered = workflows.filter(wf => {
    const matchKat = activeKategorie === 'Alle' || wf.Kategorie === activeKategorie;
    const q = search.toLowerCase();
    const matchSearch = !q || wf.Name?.toLowerCase().includes(q) || wf.Zweck?.toLowerCase().includes(q) || wf.Kategorie?.toLowerCase().includes(q);
    return matchKat && matchSearch;
  });

  const totalAktiv = workflows.filter(w => w.Status === 'aktiv').length;
  const totalInaktiv = workflows.filter(w => w.Status === 'inaktiv' || w.Status === 'in_entwicklung').length;
  const kategorienCount = Array.from(new Set(workflows.map(w => w.Kategorie).filter(Boolean))).length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={18} color="var(--accent-amber, #f59e0b)" />
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>n8n Workflows</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* View toggle */}
          <div style={{ display: 'flex', background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
            {(['cards', 'calendar'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 11px', fontSize: 12, cursor: 'pointer',
                  background: view === v ? 'rgba(56,189,248,0.12)' : 'transparent',
                  border: 'none',
                  borderRight: v === 'cards' ? '1px solid var(--border)' : 'none',
                  color: view === v ? 'var(--accent-blue)' : 'var(--text-muted)',
                  fontWeight: view === v ? 600 : 400,
                  transition: 'all 0.1s',
                }}
              >
                {v === 'cards' ? <LayoutGrid size={12} /> : <CalendarDays size={12} />}
                {v === 'cards' ? 'Karten' : 'Kalender'}
              </button>
            ))}
          </div>
          <button
            onClick={fetchWorkflows}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 7, fontSize: 12,
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} />
            Aktualisieren
          </button>
          <button
            onClick={() => exportCsv('workflows.csv', workflows as unknown as Record<string, unknown>[])}
            disabled={workflows.length === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 7, fontSize: 12,
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', cursor: workflows.length === 0 ? 'not-allowed' : 'pointer', opacity: workflows.length === 0 ? 0.5 : 1,
            }}
          >
            <Download size={12} />
            CSV
          </button>
          <a
            href="https://n8n.automation-plus-ki.de"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 7, fontSize: 12,
              background: 'rgba(245,158,11,0.15)',
              border: '1px solid rgba(245,158,11,0.35)',
              color: '#f59e0b', fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Alle in n8n
            <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Gesamt', value: loading ? '…' : workflows.length, color: 'var(--text-primary)' },
          { label: 'Aktiv', value: loading ? '…' : totalAktiv, color: '#34d399' },
          { label: 'Inaktiv / Dev', value: loading ? '…' : totalInaktiv, color: '#6b7280' },
          { label: 'Kategorien', value: loading ? '…' : kategorienCount, color: '#a78bfa' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--layer-2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '10px 16px',
            minWidth: 90,
          }}>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 700, color: stat.color }}>{String(stat.value)}</p>
            <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Search + category filter row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '0 0 240px' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Workflow suchen…"
            style={{
              width: '100%',
              paddingLeft: 30,
              paddingRight: 10,
              paddingTop: 7,
              paddingBottom: 7,
              borderRadius: 7,
              border: '1px solid var(--border)',
              background: 'var(--layer-2)',
              color: 'var(--text-primary)',
              fontSize: 12,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {KATEGORIEN.map(kat => {
            const isActive = activeKategorie === kat;
            const color = kat === 'Alle' ? '#94a3b8' : (KATEGORIE_COLORS[kat] ?? '#94a3b8');
            return (
              <button
                key={kat}
                onClick={() => setActiveKategorie(kat)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  border: `1px solid ${isActive ? `${color}50` : 'var(--border)'}`,
                  background: isActive ? `${color}18` : 'transparent',
                  color: isActive ? color : 'var(--text-muted)',
                  transition: 'all 0.1s ease',
                }}
              >
                {kat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar view */}
      {view === 'calendar' && !loading && !error && (
        <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px' }}>
          <ScheduleView workflows={workflows} />
        </div>
      )}

      {/* Cards grid */}
      {view === 'cards' && loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ height: 120, borderRadius: 10, background: 'var(--layer-2)', border: '1px solid var(--border)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : error ? (
        <div style={{ padding: '40px 20px', textAlign: 'center' }}>
          <p style={{ color: '#f87171', fontSize: 14 }}>{error}</p>
          <button onClick={fetchWorkflows} style={{ marginTop: 10, padding: '6px 14px', borderRadius: 7, background: 'var(--layer-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>
            Erneut versuchen
          </button>
        </div>
      ) : view === 'cards' && filtered.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
          Keine Workflows gefunden.
        </div>
      ) : view === 'cards' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {filtered.map(wf => (
            <WorkflowCard
              key={wf.Id ?? wf.n8n_id}
              wf={wf}
              isSelected={selected?.Id === wf.Id}
              onClick={() => setSelected(prev => prev?.Id === wf.Id ? null : wf)}
            />
          ))}
        </div>
      ) : null}

      {/* Pipeline visualizer */}
      {view === 'cards' && !loading && !error && <PipelineVisualizer />}

      {/* Detail slide-in panel */}
      {selected && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setSelected(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 99,
              background: 'rgba(0,0,0,0.3)',
            }}
          />
          <DetailPanel wf={selected} onClose={() => setSelected(null)} />
        </>
      )}
    </div>
  );
}
