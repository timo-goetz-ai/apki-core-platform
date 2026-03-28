'use client';

import { useEffect, useState } from 'react';
import {
  ExternalLink, Search, Download, Activity, Zap, Clock,
  GitBranch, DollarSign, FileOutput, StickyNote, Link2, Hash,
} from 'lucide-react';
import { exportCsv } from '@/lib/csv-export';

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

// ─── Constants ────────────────────────────────────────────────────────────────
const WORKFLOWS_TABLE = 'mfz43ghxesvn1yy';
const KATEGORIEN = ['Alle', 'System', 'KI-Chat', 'Job-Scout', 'Content', 'Voice', 'SaaS', 'DevOps', 'Daten'];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  aktiv:          { color: '#34d399', bg: 'rgba(52,211,153,0.10)',  label: 'Aktiv'          },
  inaktiv:        { color: '#6b7280', bg: 'rgba(107,114,128,0.10)', label: 'Inaktiv'        },
  in_entwicklung: { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)',  label: 'In Entwicklung' },
  archiviert:     { color: '#f87171', bg: 'rgba(248,113,113,0.10)', label: 'Archiviert'     },
};

const KOSTEN_COLORS: Record<string, string> = {
  kostenlos: '#34d399', gering: '#fbbf24', mittel: '#fb923c', hoch: '#f87171',
};

// ─── Section label helper ─────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '0 0 7px',
      fontSize: 10,
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.09em',
      fontWeight: 600,
    }}>
      {children}
    </p>
  );
}

// ─── Detail view ──────────────────────────────────────────────────────────────
function WorkflowDetail({ wf }: { wf: Workflow }) {
  const cfg = STATUS_CONFIG[wf.Status] ?? STATUS_CONFIG.inaktiv;
  const integrations = (wf.Integrationen ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const links = (wf.Verknuepfungen ?? '').split(',').map(s => s.trim()).filter(Boolean);

  return (
    <div style={{ padding: '32px 36px', overflowY: 'auto', flex: 1 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges row */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
              background: cfg.bg, color: cfg.color,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, boxShadow: wf.Status === 'aktiv' ? `0 0 5px ${cfg.color}` : 'none' }} />
              {cfg.label}
            </span>
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: 11,
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
            }}>
              {wf.Kategorie}
            </span>
            {wf.Prioritaet && (
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11,
                background: 'var(--layer-2)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
              }}>
                Prio: {wf.Prioritaet}
              </span>
            )}
          </div>

          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            {wf.Name}
          </h2>
          {wf.n8n_id && (
            <p style={{ margin: '5px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <Hash size={10} style={{ display: 'inline', marginRight: 3 }} />{wf.n8n_id}
            </p>
          )}
        </div>

        {wf.n8n_url && (
          <a
            href={wf.n8n_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 8, flexShrink: 0,
              background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)',
              color: '#fbbf24', fontSize: 12, fontWeight: 500, textDecoration: 'none',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(251,191,36,0.14)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(251,191,36,0.08)'; }}
          >
            In n8n öffnen <ExternalLink size={11} />
          </a>
        )}
      </div>

      {/* ── Zweck & Anwendungsfall ── */}
      {wf.Zweck && (
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>Zweck &amp; Anwendungsfall</SectionLabel>
          <div style={{
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '16px 20px',
          }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.75 }}>
              {wf.Zweck}
            </p>
          </div>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Trigger',     value: wf.Trigger   || '—', Icon: Zap,         color: '#38bdf8' },
          { label: 'Intervall',   value: wf.Intervall  || '—', Icon: Clock,        color: '#a78bfa' },
          { label: 'Laufzeit',    value: wf.Laufzeit_Sek ? `${wf.Laufzeit_Sek}s` : '—', Icon: Activity, color: '#34d399' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} style={{
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '13px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7, color: 'var(--text-muted)' }}>
              <Icon size={12} />
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {label}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Kosten ── */}
      {wf.Kosten && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel><DollarSign size={9} style={{ display: 'inline', marginRight: 3 }} />Betriebskosten</SectionLabel>
          <span style={{
            display: 'inline-block',
            padding: '4px 12px', borderRadius: 6, fontSize: 12,
            fontFamily: 'var(--font-mono)', fontWeight: 700,
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            color: KOSTEN_COLORS[wf.Kosten] ?? 'var(--text-muted)',
          }}>
            {wf.Kosten}
          </span>
        </div>
      )}

      {/* ── Output ── */}
      {wf.Output && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel><FileOutput size={9} style={{ display: 'inline', marginRight: 3 }} />Output</SectionLabel>
          <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{wf.Output}</p>
          </div>
        </div>
      )}

      {/* ── Integrationen ── */}
      {integrations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel><GitBranch size={9} style={{ display: 'inline', marginRight: 3 }} />Integrationen</SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {integrations.map(i => (
              <span key={i} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11,
                fontFamily: 'var(--font-mono)',
                background: 'var(--layer-2)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}>
                {i}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Verknüpfte Workflows ── */}
      {links.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel><Link2 size={9} style={{ display: 'inline', marginRight: 3 }} />Verknüpfte Workflows</SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {links.map(l => (
              <span key={l} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 11,
                background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)',
                color: 'var(--text-muted)',
              }}>
                {l}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Notizen ── */}
      {wf.Notizen && (
        <div style={{ marginBottom: 20 }}>
          <SectionLabel><StickyNote size={9} style={{ display: 'inline', marginRight: 3 }} />Notizen</SectionLabel>
          <div style={{
            background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.15)',
            borderRadius: 10, padding: '12px 16px',
          }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.65, fontFamily: 'var(--font-mono)' }}>
              {wf.Notizen}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyDetail({ count }: { count: number }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-muted)', gap: 10, padding: 40,
    }}>
      <Activity size={36} style={{ opacity: 0.2 }} />
      <p style={{ margin: 0, fontSize: 15, fontWeight: 500, opacity: 0.6 }}>Workflow auswählen</p>
      <p style={{ margin: 0, fontSize: 12, opacity: 0.4 }}>{count} Workflows verfügbar</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [kategorie, setKategorie] = useState('Alle');
  const [selected, setSelected]   = useState<Workflow | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch(`/api/nocodb/table?id=${WORKFLOWS_TABLE}&limit=200`);
        const data = await res.json();
        const list: Workflow[] = Array.isArray(data) ? data : (data.list ?? []);
        setWorkflows(list);
        if (list.length > 0) setSelected(list[0]);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = workflows.filter(wf => {
    const matchKat    = kategorie === 'Alle' || wf.Kategorie === kategorie;
    const q           = search.toLowerCase();
    const matchSearch = !q || (wf.Name ?? '').toLowerCase().includes(q) || (wf.Zweck ?? '').toLowerCase().includes(q);
    return matchKat && matchSearch;
  });

  const aktiv         = workflows.filter(w => w.Status === 'aktiv').length;
  const inEntwicklung = workflows.filter(w => w.Status === 'in_entwicklung').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{
        padding: '18px 28px 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
        background: 'var(--layer-1)',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: 'var(--text-primary)' }}>Workflows</h1>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {workflows.length} gesamt · {aktiv} aktiv · {inEntwicklung} in Entwicklung
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => exportCsv('workflows.csv', filtered as unknown as Record<string, unknown>[])}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7,
                background: 'var(--layer-2)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer',
              }}
            >
              <Download size={12} /> CSV
            </button>
            <a
              href="https://n8n.automation-plus-ki.de"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 7,
                background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.22)',
                color: '#fbbf24', fontSize: 12, fontWeight: 500, textDecoration: 'none',
              }}
            >
              n8n öffnen <ExternalLink size={11} />
            </a>
          </div>
        </div>

        {/* Search + Category filter */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <Search size={12} style={{
              position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-muted)', pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Name oder Zweck suchen…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: 240, paddingLeft: 28, paddingRight: 10, height: 32, borderRadius: 7,
                background: 'var(--layer-2)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: 12, outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {KATEGORIEN.map(k => {
              const isActive = kategorie === k;
              return (
                <button
                  key={k}
                  onClick={() => setKategorie(k)}
                  style={{
                    padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                    background: isActive ? 'rgba(56,189,248,0.1)' : 'transparent',
                    border: isActive ? '1px solid rgba(56,189,248,0.28)' : '1px solid transparent',
                    color: isActive ? '#38bdf8' : 'var(--text-muted)',
                    fontWeight: isActive ? 600 : 400, transition: 'all 0.1s',
                  }}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 2-panel body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT — Workflow list */}
        <div style={{
          width: 320, flexShrink: 0,
          borderRight: '1px solid var(--border)',
          overflowY: 'auto',
          background: 'var(--layer-0)',
        }}>
          {loading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{
                padding: '13px 16px', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ height: 12, width: '70%', borderRadius: 4, background: 'var(--layer-2)', marginBottom: 6 }} />
                <div style={{ height: 9, width: '40%', borderRadius: 4, background: 'var(--layer-2)', opacity: 0.5 }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              Keine Treffer
            </div>
          ) : (
            filtered.map(wf => {
              const cfg        = STATUS_CONFIG[wf.Status] ?? STATUS_CONFIG.inaktiv;
              const isSelected = selected?.Id === wf.Id;
              return (
                <div
                  key={wf.Id}
                  onClick={() => setSelected(wf)}
                  style={{
                    padding: '11px 16px',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: `2px solid ${isSelected ? '#38bdf8' : 'transparent'}`,
                    background: isSelected ? 'rgba(56,189,248,0.05)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: cfg.color,
                      boxShadow: wf.Status === 'aktiv' ? `0 0 4px ${cfg.color}80` : 'none',
                    }} />
                    <span style={{
                      fontSize: 12, fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? '#f1f5f9' : 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    }}>
                      {wf.Name}
                    </span>
                  </div>
                  <div style={{ marginTop: 4, marginLeft: 15, display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {wf.Kategorie}
                    </span>
                    {wf.Intervall && (
                      <span style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-mono)' }}>
                        {wf.Intervall}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT — Detail */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--layer-1)' }}>
          {selected
            ? <WorkflowDetail wf={selected} />
            : <EmptyDetail count={filtered.length} />
          }
        </div>
      </div>
    </div>
  );
}
