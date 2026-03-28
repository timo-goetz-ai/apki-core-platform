'use client';

import { useEffect, useState, useCallback } from 'react';
import { Bot, RefreshCw, Play, Clock, FileText, Users, Zap, CheckCircle2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ContentPiece {
  piece_id: string;
  title: string;
  status: string;
  created_at: string;
}

interface Crew {
  id: string;
  name: string;
  agents: number;
  tasks: number;
  last_run: string | null;
  recent_pieces: ContentPiece[];
}

// ── Static agent roster per crew (from crews.yaml) ────────────────────────────

const CREW_AGENTS: Record<string, { role: string; color: string }[]> = {
  content_generation_crew: [
    { role: 'Content Researcher', color: '#60a5fa' },
    { role: 'Writer & SEO', color: '#a78bfa' },
  ],
  niche_analysis_crew: [
    { role: 'Audience Analyst', color: '#34d399' },
    { role: 'Opportunity Scorer', color: '#fb923c' },
  ],
  content_forecast_crew: [
    { role: 'Trend Analyst', color: '#f472b6' },
    { role: 'Content Strategist', color: '#fbbf24' },
  ],
  deep_research_crew: [
    { role: 'Senior Researcher', color: '#60a5fa' },
    { role: 'Synthesis Specialist', color: '#a78bfa' },
  ],
  quick_research_crew: [
    { role: 'Research Analyst', color: '#34d399' },
  ],
};

const CREW_ICON_COLOR: Record<string, string> = {
  content_generation_crew: '#a78bfa',
  niche_analysis_crew:     '#34d399',
  content_forecast_crew:   '#fb923c',
  deep_research_crew:      '#60a5fa',
  quick_research_crew:     '#fbbf24',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function relTime(iso: string | null): string {
  if (!iso) return 'Noch nie';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Gerade eben';
  if (m < 60) return `vor ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h}h`;
  return `vor ${Math.floor(h / 24)}d`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AgentChip({ role, color }: { role: string; color: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 6,
      background: `${color}14`, border: `1px solid ${color}30`,
    }}>
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color, fontWeight: 500 }}>{role}</span>
    </div>
  );
}

function RunButton({ crewId, onDone }: { crewId: string; onDone: () => void }) {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'err'>('idle');

  async function run() {
    if (state === 'running') return;
    setState('running');
    try {
      const res = await fetch(`/api/n8n/trigger/j4DqKVd9N2U1AEGy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: 'KI-Agenten 2026', category: 'KI-Tools', target_platforms: 'blog' }),
      });
      setState(res.ok ? 'done' : 'err');
      if (res.ok) setTimeout(() => { setState('idle'); onDone(); }, 3000);
    } catch { setState('err'); }
  }

  const label = state === 'running' ? 'Läuft…' : state === 'done' ? 'Gestartet ✓' : state === 'err' ? 'Fehler' : 'Run';
  const bg = state === 'running' ? 'rgba(96,165,250,0.12)' : state === 'done' ? 'rgba(52,211,153,0.12)' : state === 'err' ? 'rgba(248,113,113,0.12)' : 'var(--layer-3)';
  const bdr = state === 'running' ? '#60a5fa' : state === 'done' ? '#34d399' : state === 'err' ? '#f87171' : 'var(--border-bright)';

  // Only content_generation_crew supports direct run via 450v2 webhook for now
  if (crewId !== 'content_generation_crew') return null;

  return (
    <button onClick={run} style={{
      display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px',
      borderRadius: 6, border: `1px solid ${bdr}`, background: bg,
      cursor: 'pointer', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)',
      transition: 'all 0.15s',
    }}>
      <Play size={9} />
      {label}
    </button>
  );
}

function CrewCard({ crew, onRefresh }: { crew: Crew; onRefresh: () => void }) {
  const agents = CREW_AGENTS[crew.id] ?? [];
  const accent = CREW_ICON_COLOR[crew.id] ?? '#60a5fa';

  return (
    <div style={{
      background: 'var(--layer-2)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'border-color 0.15s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9, flexShrink: 0,
          background: `${accent}18`, border: `1px solid ${accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Users size={16} style={{ color: accent }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{crew.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginLeft: 'auto', flexShrink: 0 }}>
              {crew.agents} Agents · {crew.tasks} Tasks
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Clock size={9} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {relTime(crew.last_run)}
            </span>
          </div>
        </div>
        <RunButton crewId={crew.id} onDone={onRefresh} />
      </div>

      {/* Agent chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {agents.map(a => <AgentChip key={a.role} role={a.role} color={a.color} />)}
      </div>

      {/* Recent outputs */}
      {crew.recent_pieces.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Letzte Outputs
          </span>
          {crew.recent_pieces.map(p => (
            <div key={p.piece_id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.title ?? p.piece_id}
              </span>
              <span style={{
                fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4,
                background: p.status === 'draft' ? 'rgba(251,191,36,0.12)' : 'rgba(52,211,153,0.12)',
                color: p.status === 'draft' ? '#fbbf24' : '#34d399',
              }}>
                {p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [totalPieces, setTotalPieces] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/crews');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCrews(data.crews ?? []);
      setTotalPieces(data.total_pieces ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalAgents = crews.reduce((s, c) => s + c.agents, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--layer-0)' }}>

      {/* Header bar */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--layer-1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={16} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Agent Teams</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>Crew AI — Live Instanz</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} style={{
          display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
          borderRadius: 6, border: '1px solid var(--border)', background: 'var(--layer-2)',
          cursor: 'pointer', fontSize: 11, color: 'var(--text-secondary)',
        }}>
          <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Aktualisieren
        </button>
      </div>

      {/* KPI strip */}
      {!loading && crews.length > 0 && (
        <div style={{
          display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
          background: 'var(--layer-1)',
        }}>
          {[
            { icon: <Users size={12} />, label: 'Crews', value: crews.length, color: 'var(--accent-blue)' },
            { icon: <Bot size={12} />, label: 'Agents total', value: totalAgents, color: '#a78bfa' },
            { icon: <FileText size={12} />, label: 'Pieces generiert', value: totalPieces, color: '#34d399' },
            { icon: <CheckCircle2 size={12} />, label: 'Instanz', value: 'Online', color: '#34d399' },
          ].map((k, i) => (
            <div key={i} style={{
              flex: 1, padding: '10px 20px', borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ color: k.color }}>{k.icon}</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: k.color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                  {k.value}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 1 }}>{k.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {error && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, background: 'rgba(248,113,113,0.08)',
            border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', fontSize: 13, marginBottom: 20,
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 180, borderRadius: 12, background: 'var(--layer-2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {crews.map(crew => (
                <CrewCard key={crew.id} crew={crew} onRefresh={load} />
              ))}
            </div>

            {/* Model info footer */}
            <div style={{
              marginTop: 24, padding: '10px 16px', borderRadius: 8,
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Zap size={12} style={{ color: '#fbbf24' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Alle Crews laufen auf <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>gemini-2.5-flash</span> via Google OpenAI-kompatibler API ·
                Crew API: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>online</span> ·
                Redis: <span style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>connected</span>
              </span>
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}
