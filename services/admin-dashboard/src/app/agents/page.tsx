'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  RefreshCw, Play, Clock, FileText, Zap,
  CheckCircle2, Activity, AlertTriangle, XCircle, Radio, Bot, Wifi,
} from 'lucide-react';

// ── Robot Character Definitions ───────────────────────────────────────────────

interface RobotChar {
  name: string;       // Charakter-Name
  trait: string;      // Eigenschaft
  color: string;      // Akzentfarbe
  avatar: string;     // Emoji-Avatar
  bgColor: string;    // Hintergrundton
}

const ROBOTS: Record<string, RobotChar> = {
  'Content Researcher':  { name: 'Llama-Geist',        trait: 'Kapazität',        color: '#34d399', bgColor: 'rgba(52,211,153,0.1)',   avatar: '🦙' },
  'Writer & SEO':        { name: 'Claude-Assistent',   trait: 'Genauigkeit',      color: '#c084fc', bgColor: 'rgba(192,132,252,0.1)',  avatar: '🤖' },
  'Audience Analyst':    { name: 'Gemi-Schmied',       trait: 'Vielseitigkeit',   color: '#fbbf24', bgColor: 'rgba(251,191,36,0.1)',   avatar: '⚙️' },
  'Opportunity Scorer':  { name: 'X-Agent Alpha',      trait: 'Geschwindigkeit',  color: '#f87171', bgColor: 'rgba(248,113,113,0.1)',  avatar: '⚡' },
  'Trend Analyst':       { name: 'Tiefsee-Suche',      trait: 'Robustheit',       color: '#22d3ee', bgColor: 'rgba(34,211,238,0.1)',   avatar: '🔭' },
  'Content Strategist':  { name: "Mistral's Windzug",  trait: 'Effizienz',        color: '#60a5fa', bgColor: 'rgba(96,165,250,0.1)',   avatar: '💨' },
  'Senior Researcher':   { name: 'Gemini-U',           trait: 'Innovation',       color: '#4ade80', bgColor: 'rgba(74,222,128,0.1)',   avatar: '🔬' },
  'Synthesis Specialist':{ name: 'Gemini-C',           trait: 'Integration',      color: '#fb923c', bgColor: 'rgba(251,146,60,0.1)',   avatar: '🧬' },
  'Research Analyst':    { name: 'Llama-H',            trait: 'Skalierbarkeit',   color: '#86efac', bgColor: 'rgba(134,239,172,0.1)',  avatar: '📡' },
  // Multichannel-Fabrik
  'Content Writer & SEO': { name: 'Claude-Assistent',  trait: 'Genauigkeit',      color: '#c084fc', bgColor: 'rgba(192,132,252,0.1)',  avatar: '🤖' },
  'Viral Content Scout': { name: 'Mistral-F',          trait: 'Viralität',        color: '#f472b6', bgColor: 'rgba(244,114,182,0.1)',  avatar: '🚀' },
  // Red Team
  'Fact Checker':        { name: 'Llama-B',            trait: 'Präzision',        color: '#f87171', bgColor: 'rgba(248,113,113,0.1)',  avatar: '🔍' },
  'Resonance Checker':   { name: 'Mistral-L',          trait: 'Resonanz',         color: '#a78bfa', bgColor: 'rgba(167,139,250,0.1)',  avatar: '🎯' },
  'Speed Reviewer':      { name: 'Llama-H',            trait: 'Tempo',            color: '#86efac', bgColor: 'rgba(134,239,172,0.1)',  avatar: '⚡' },
  // Market Intelligence
  'Trend Scout':         { name: 'Tiefsee-Suche',      trait: 'Robustheit',       color: '#22d3ee', bgColor: 'rgba(34,211,238,0.1)',   avatar: '🔭' },
  'Opportunity Evaluator':{ name: 'X-Agent Alpha',     trait: 'Geschwindigkeit',  color: '#f87171', bgColor: 'rgba(248,113,113,0.1)',  avatar: '⚡' },
  'Briefing Creator':    { name: 'Gemini-U',           trait: 'Innovation',       color: '#4ade80', bgColor: 'rgba(74,222,128,0.1)',   avatar: '📋' },
  // Director
  'Director Agent':      { name: 'AIOS Director',      trait: 'Orchestrierung',   color: '#fbbf24', bgColor: 'rgba(251,191,36,0.1)',   avatar: '🎬' },
};

function getRobot(role: string): RobotChar {
  return ROBOTS[role] ?? { name: role, trait: '', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.1)', avatar: '🤖' };
}

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

interface TimelineEntry {
  id: string;
  at: string;
  kind: 'info' | 'task' | 'ok' | 'err';
  title: string;
  detail?: string;
  agentId?: string;
}

type AgentStatus = 'idle' | 'working' | 'done' | 'error';
type AgentLive = { status: AgentStatus; taskId?: string; output?: string };

// ── Static agent roster ────────────────────────────────────────────────────────

const CREW_AGENTS: Record<string, { role: string; color: string }[]> = {
  content_generation_crew: [
    { role: 'Content Researcher', color: '#34d399' },
    { role: 'Writer & SEO',       color: '#c084fc' },
  ],
  niche_analysis_crew: [
    { role: 'Audience Analyst',   color: '#fbbf24' },
    { role: 'Opportunity Scorer', color: '#f87171' },
  ],
  content_forecast_crew: [
    { role: 'Trend Analyst',      color: '#22d3ee' },
    { role: 'Content Strategist', color: '#60a5fa' },
  ],
  deep_research_crew: [
    { role: 'Senior Researcher',    color: '#4ade80' },
    { role: 'Synthesis Specialist', color: '#fb923c' },
  ],
  quick_research_crew: [{ role: 'Research Analyst', color: '#86efac' }],
  multichannel_fabrik_crew: [
    { role: 'Content Strategist',   color: '#60a5fa' },
    { role: 'Content Writer & SEO', color: '#c084fc' },
    { role: 'Viral Content Scout',  color: '#f472b6' },
  ],
  red_team_crew: [
    { role: 'Fact Checker',      color: '#f87171' },
    { role: 'Resonance Checker', color: '#a78bfa' },
    { role: 'Speed Reviewer',    color: '#86efac' },
  ],
  market_intelligence_crew: [
    { role: 'Trend Scout',            color: '#22d3ee' },
    { role: 'Opportunity Evaluator',  color: '#f87171' },
    { role: 'Briefing Creator',       color: '#4ade80' },
  ],
  director_crew: [
    { role: 'Director Agent', color: '#fbbf24' },
  ],
};

const CREW_ACCENT: Record<string, string> = {
  content_generation_crew:  '#c084fc',
  niche_analysis_crew:      '#fbbf24',
  content_forecast_crew:    '#22d3ee',
  deep_research_crew:       '#4ade80',
  quick_research_crew:      '#86efac',
  multichannel_fabrik_crew: '#f472b6',
  red_team_crew:            '#f87171',
  market_intelligence_crew: '#22d3ee',
  director_crew:            '#fbbf24',
};

const DEFAULT_INPUTS: Record<string, Record<string, string>> = {
  content_generation_crew:  { topic: 'KI-Agenten 2026', category: 'KI-Tools', target_platforms: 'blog' },
  niche_analysis_crew:      { topic: 'Nischen-Analyse', category: 'Markt', target_platforms: 'internal' },
  content_forecast_crew:    { topic: 'Content-Trends', category: 'Prognose', target_platforms: 'blog' },
  deep_research_crew:       { topic: 'Deep Research', category: 'Research', target_platforms: 'blog' },
  quick_research_crew:      { topic: 'Quick Scan', category: 'Research', target_platforms: 'blog' },
  multichannel_fabrik_crew: { topic: 'KI-Automatisierung 2026', category: 'KI-Tools', target_platforms: 'blog,instagram,linkedin' },
  red_team_crew:            { topic: 'Content Review', category: 'Quality', target_platforms: 'internal' },
  market_intelligence_crew: { topic: 'KI-Markt Trends', category: 'Research', target_platforms: 'internal' },
  director_crew:            { user_prompt: 'Analysiere aktuelle KI-Trends und erstelle Content', target_platforms: 'blog' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function prettyName(id: string) {
  return id.split('_').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
}

function buildFallbackCrews(): Crew[] {
  return Object.keys(CREW_AGENTS).map(id => ({
    id, name: prettyName(id), agents: CREW_AGENTS[id].length,
    tasks: CREW_AGENTS[id].length, last_run: null, recent_pieces: [],
  }));
}

function relTime(iso: string | null) {
  if (!iso) return 'Noch nie';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Gerade eben';
  if (m < 60) return `vor ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h}h`;
  return `vor ${Math.floor(h / 24)}d`;
}

// ── Robot Avatar ──────────────────────────────────────────────────────────────

function RobotAvatar({
  role, status = 'idle', size = 52,
}: { role: string; status?: AgentStatus; size?: number }) {
  const r = getRobot(role);
  const pulse = status === 'working';
  const borderColor = status === 'working' ? r.color
    : status === 'done'  ? '#34d399'
    : status === 'error' ? '#f87171'
    : 'rgba(148,163,184,0.2)';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {pulse && (
        <div style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          border: `2px solid ${r.color}`,
          animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
          opacity: 0.6,
        }} />
      )}
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: r.bgColor,
        border: `2px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: size * 0.42,
        transition: 'border-color 0.3s',
        position: 'relative', zIndex: 1,
      }}>
        {r.avatar}
      </div>
    </div>
  );
}

// ── Agent Card (live) ─────────────────────────────────────────────────────────

function AgentCard({ role, live }: { role: string; live?: AgentLive }) {
  const r = getRobot(role);
  const st = live?.status ?? 'idle';
  const statusLabel = st === 'working' ? 'Arbeitet…' : st === 'done' ? 'Fertig' : st === 'error' ? 'Fehler' : 'Bereit';
  const statusColor = st === 'working' ? '#fbbf24' : st === 'done' ? '#34d399' : st === 'error' ? '#f87171' : '#94a3b8';

  return (
    <div style={{
      background: 'var(--layer-2)',
      border: `1px solid ${st !== 'idle' ? r.color + '40' : 'var(--border)'}`,
      borderRadius: 14,
      padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'border-color 0.3s, box-shadow 0.3s',
      boxShadow: st === 'working' ? `0 0 16px ${r.color}20` : 'none',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <RobotAvatar role={role} status={st} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</div>
          <div style={{ fontSize: 10, color: r.color, fontWeight: 600, marginTop: 1 }}>{r.trait.toUpperCase()}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{role}</div>
        </div>
        <div style={{
          fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
          background: statusColor + '18', color: statusColor, border: `1px solid ${statusColor}40`,
        }}>
          {statusLabel}
        </div>
      </div>

      {/* Task/Output */}
      {live?.taskId && (
        <div style={{
          background: 'var(--layer-3)', borderRadius: 8, padding: '7px 10px',
          borderLeft: `3px solid ${r.color}`,
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>
            TASK · {live.taskId}
          </div>
          {live.output && (
            <div style={{ fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {live.output.slice(0, 180)}{live.output.length > 180 ? '…' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Crew Flow Viz ─────────────────────────────────────────────────────────────

function CrewFlowViz({ crewId, activeAgents }: { crewId: string; activeAgents: Record<string, AgentLive> }) {
  const agents = CREW_AGENTS[crewId] ?? [];
  if (!agents.length) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', padding: '6px 0' }}>
      {agents.map((a, i) => {
        const r = getRobot(a.role);
        const live = activeAgents[a.role];
        const st = live?.status ?? 'idle';
        const active = st === 'working';
        return (
          <div key={a.role} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '6px 10px', borderRadius: 10,
              background: active ? r.bgColor : 'transparent',
              border: `1px solid ${active ? r.color + '60' : 'transparent'}`,
              transition: 'all 0.3s',
            }}>
              <RobotAvatar role={a.role} status={st} size={32} />
              <span style={{ fontSize: 9, color: active ? r.color : 'var(--text-muted)', fontWeight: 600, maxWidth: 64, textAlign: 'center' }}>
                {r.name.split("'")[0].split(' ')[0]}
              </span>
            </div>
            {i < agents.length - 1 && (
              <div style={{
                width: 20, height: 1,
                background: `linear-gradient(90deg, ${agents[i] ? getRobot(agents[i].role).color + '60' : '#333'}, ${getRobot(agents[i + 1]?.role ?? '').color + '60'})`,
                flexShrink: 0, margin: '0 -2px',
              }} />
            )}
          </div>
        );
      })}
      <div style={{ marginLeft: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 20, height: 1, background: 'rgba(148,163,184,0.3)' }} />
        <div style={{
          padding: '4px 10px', borderRadius: 8, fontSize: 9, fontWeight: 700,
          background: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.2)',
          color: 'var(--text-muted)',
        }}>
          OUTPUT
        </div>
      </div>
    </div>
  );
}

// ── Timeline ──────────────────────────────────────────────────────────────────

function TimelinePanel({ entries }: { entries: TimelineEntry[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [entries.length]);

  const color = (k: TimelineEntry['kind']) =>
    k === 'ok' ? '#34d399' : k === 'err' ? '#f87171' : k === 'task' ? '#60a5fa' : '#94a3b8';

  return (
    <div ref={ref} style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 2 }}>
      {entries.length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '8px 0' }}>
          Warte auf Events…
        </div>
      )}
      {entries.map((e) => {
        const r = e.agentId ? getRobot(e.agentId) : null;
        return (
          <div key={e.id} style={{
            fontSize: 11, padding: '7px 10px', borderRadius: 8,
            background: 'var(--layer-2)', borderLeft: `3px solid ${color(e.kind)}`,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            {r && <span style={{ fontSize: 14, flexShrink: 0, marginTop: -1 }}>{r.avatar}</span>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.title}</span>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {new Date(e.at).toLocaleTimeString('de-DE')}
                </span>
              </div>
              {e.detail && (
                <div style={{ marginTop: 3, fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.35, wordBreak: 'break-word' }}>
                  {e.detail}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Live Execution Panel ──────────────────────────────────────────────────────

function LivePanel({
  execId, crewId, crewLabel, timeline, agents, wsConnected, streamFault, onClose,
}: {
  execId: string; crewId: string; crewLabel: string;
  timeline: TimelineEntry[]; agents: Record<string, AgentLive>;
  wsConnected: boolean; streamFault?: string | null; onClose: () => void;
}) {
  const crewAgents = CREW_AGENTS[crewId] ?? [];

  return (
    <div style={{
      marginBottom: 20, padding: '16px 18px', borderRadius: 14,
      border: '1px solid rgba(96,165,250,0.3)',
      background: 'linear-gradient(135deg, rgba(96,165,250,0.06), rgba(15,23,42,0.5))',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <Radio size={14} style={{ color: '#34d399', animation: 'pulse 1.2s ease-in-out infinite' }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Live · {crewLabel}</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
          padding: '2px 8px', borderRadius: 10,
          background: wsConnected ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)',
          border: `1px solid ${wsConnected ? '#34d39940' : '#fbbf2440'}`,
          color: wsConnected ? '#34d399' : '#fbbf24',
        }}>
          <Wifi size={9} />
          {wsConnected ? 'WebSocket' : 'SSE'}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', flex: 1, minWidth: 100 }}>
          {execId.slice(0, 20)}…
        </span>
        <button type="button" onClick={onClose} style={{
          fontSize: 10, padding: '4px 12px', borderRadius: 6,
          border: '1px solid var(--border)', background: 'var(--layer-2)',
          color: 'var(--text-muted)', cursor: 'pointer',
        }}>
          Schließen
        </button>
      </div>

      {/* Crew Flow Visualization */}
      <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: 'var(--layer-2)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Crew Flow
        </div>
        <CrewFlowViz crewId={crewId} activeAgents={agents} />
      </div>

      {streamFault && (
        <div style={{
          marginBottom: 12, padding: '10px 12px', borderRadius: 8,
          border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.08)',
          fontSize: 11, color: '#fecaca',
        }}>
          <strong style={{ color: '#f87171' }}>Verbindungsfehler:</strong>
          <div style={{ marginTop: 4 }}>{streamFault}</div>
        </div>
      )}

      {/* Split: Agent Cards + Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
        {/* Agent Cards */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Agenten ({crewAgents.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {crewAgents.map(a => (
              <AgentCard key={a.role} role={a.role} live={agents[a.role]} />
            ))}
            {/* Also show agents from live data not in static roster */}
            {Object.keys(agents)
              .filter(aid => !crewAgents.find(a => a.role === aid))
              .map(aid => <AgentCard key={aid} role={aid} live={agents[aid]} />)
            }
            {crewAgents.length === 0 && Object.keys(agents).length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Warte auf Agent-Events…</div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Echtzeit-Log ({timeline.length})
          </div>
          <TimelinePanel entries={timeline} />
        </div>
      </div>
    </div>
  );
}

// ── Run Button ────────────────────────────────────────────────────────────────

function RunButton({ crewId, onStarted, busy }: {
  crewId: string;
  onStarted: (execId: string, crewId: string, label: string) => void;
  busy: boolean;
}) {
  const [st, setSt] = useState<'idle' | 'running' | 'done' | 'err'>('idle');

  async function run() {
    if (st === 'running' || busy) return;
    setSt('running');
    try {
      const inputs = DEFAULT_INPUTS[crewId] ?? { topic: 'Demo', category: 'Allgemein', target_platforms: 'blog' };
      const res = await fetch(`/api/crews/${encodeURIComponent(crewId)}/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });
      const data = await res.json().catch(() => ({})) as { execution_id?: string };
      if (res.ok && data.execution_id) {
        setSt('done');
        onStarted(String(data.execution_id), crewId, prettyName(crewId));
        setTimeout(() => setSt('idle'), 800);
      } else {
        setSt('err');
        setTimeout(() => setSt('idle'), 2500);
      }
    } catch {
      setSt('err');
      setTimeout(() => setSt('idle'), 2500);
    }
  }

  const label = st === 'running' ? 'Start…' : st === 'done' ? '✓ Gestartet' : st === 'err' ? '✗ Fehler' : '▶ Starten';
  const color = st === 'running' ? '#60a5fa' : st === 'done' ? '#34d399' : st === 'err' ? '#f87171' : 'var(--text-muted)';

  return (
    <button type="button" onClick={run} disabled={st === 'running' || busy} style={{
      display: 'flex', alignItems: 'center', gap: 4,
      padding: '5px 12px', borderRadius: 8,
      border: `1px solid ${color}40`, background: `${color}10`,
      cursor: st === 'running' || busy ? 'default' : 'pointer',
      fontSize: 11, fontWeight: 600, color,
      transition: 'all 0.15s',
    }}>
      <Play size={9} />
      {label}
    </button>
  );
}

// ── Crew Card ─────────────────────────────────────────────────────────────────

function CrewCard({ crew, onStarted, busy }: {
  crew: Crew;
  onStarted: (execId: string, crewId: string, label: string) => void;
  busy: boolean;
}) {
  const agents = CREW_AGENTS[crew.id] ?? [];
  const accent = CREW_ACCENT[crew.id] ?? '#60a5fa';

  return (
    <div style={{
      background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 14,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = accent + '50')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: accent + '18', border: `1px solid ${accent}35`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {agents[0] ? getRobot(agents[0].role).avatar : '🤖'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{crew.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {crew.agents} Agents · {crew.tasks} Tasks · {relTime(crew.last_run)}
          </div>
        </div>
        <RunButton crewId={crew.id} onStarted={onStarted} busy={busy} />
      </div>

      {/* Agent roster with robot names */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {agents.map(a => {
          const r = getRobot(a.role);
          return (
            <div key={a.role} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 9px', borderRadius: 20,
              background: r.bgColor, border: `1px solid ${r.color}35`,
            }}>
              <span style={{ fontSize: 12 }}>{r.avatar}</span>
              <div>
                <span style={{ fontSize: 11, color: r.color, fontWeight: 600 }}>{r.name}</span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 4 }}>({r.trait})</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent outputs */}
      {crew.recent_pieces.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Letzte Outputs
          </span>
          {crew.recent_pieces.slice(0, 3).map(p => (
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

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AgentsPage() {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [totalPieces, setTotalPieces] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [crewApiOk, setCrewApiOk] = useState(true);

  // Live stream state
  const [execId, setExecId]       = useState<string | null>(null);
  const [execCrewId, setExecCrewId] = useState('');
  const [execLabel, setExecLabel] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [streamFault, setStreamFault] = useState<string | null>(null);
  const [timeline, setTimeline]   = useState<TimelineEntry[]>([]);
  const [agentLive, setAgentLive] = useState<Record<string, AgentLive>>({});
  const finishedRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/crews');
      const data = await res.json();
      if (!res.ok) {
        setCrews(buildFallbackCrews()); setTotalPieces(0); setCrewApiOk(false);
        setError(data.error ?? 'Crew-API eingeschränkt — Fallback'); return;
      }
      let list: Crew[] = data.crews ?? [];
      if (!list.length) {
        list = buildFallbackCrews();
        setCrewApiOk(!!data.crew_api_reachable);
        if (!data.crew_api_reachable) setError('Crew-API ohne Crews — zeige lokale Config. Prüfe CREW_API_URL.');
      } else {
        setCrewApiOk(data.crew_api_reachable !== false);
      }
      setCrews(list); setTotalPieces(data.total_pieces ?? 0);
    } catch (e) {
      setCrews(buildFallbackCrews()); setCrewApiOk(false);
      setError(e instanceof Error ? e.message : 'Netzwerkfehler');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStarted = useCallback((newExecId: string, crewId: string, label: string) => {
    finishedRef.current = false;
    setStreamFault(null); setTimeline([]); setAgentLive({});
    setExecId(newExecId); setExecCrewId(crewId); setExecLabel(label);
  }, []);

  const closeStream = useCallback(() => {
    wsRef.current?.close();
    setExecId(null); setStreamFault(null); setTimeline([]); setAgentLive({}); setWsConnected(false);
  }, []);

  // WebSocket with SSE fallback
  useEffect(() => {
    if (!execId) return;

    function handleMsg(raw: string) {
      try {
        const msg = JSON.parse(raw) as Record<string, unknown>;
        const t = String(msg.type ?? '');
        const ts = new Date().toISOString();
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const agentId = String(msg.agent_id ?? '');

        if (t === 'execution_started') {
          setTimeline(p => [...p, { id, at: ts, kind: 'info', title: 'Execution gestartet', detail: String(msg.crew_id ?? '') }]);
        }
        if (t === 'task_started') {
          setAgentLive(p => ({ ...p, [agentId]: { ...p[agentId], status: 'working', taskId: String(msg.task_id ?? '') } }));
          setTimeline(p => [...p, { id, at: ts, kind: 'task', title: `▶ Task gestartet`, detail: String(msg.task_id ?? ''), agentId }]);
        }
        if (t === 'task_completed') {
          const out = String(msg.output ?? '').slice(0, 400);
          setAgentLive(p => ({ ...p, [agentId]: { status: 'done', taskId: String(msg.task_id ?? p[agentId]?.taskId ?? ''), output: out } }));
          setTimeline(p => [...p, { id, at: ts, kind: 'ok', title: '✓ Task abgeschlossen', detail: out.slice(0, 120), agentId }]);
        }
        if (t === 'execution_completed') {
          finishedRef.current = true;
          setTimeline(p => [...p, { id, at: ts, kind: 'ok', title: '🎉 Crew fertig', detail: String(msg.result ?? '').slice(0, 200) }]);
          wsRef.current?.close();
          setTimeout(() => { setExecId(null); load(); }, 1600);
        }
        if (t === 'execution_error') {
          finishedRef.current = true;
          setTimeline(p => [...p, { id, at: ts, kind: 'err', title: '✗ Execution-Fehler', detail: String(msg.error ?? '') }]);
          wsRef.current?.close();
          setTimeout(() => setExecId(null), 2500);
        }
      } catch { /* ignore */ }
    }

    // Try WebSocket first
    let ws: WebSocket | null = null;
    let usedSSE = false;

    try {
      const wsUrl = `/api/crews/ws/${encodeURIComponent(execId)}`;
      // Convert relative URL to ws:// by detecting protocol
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const fullWsUrl = `${proto}//${window.location.host}${wsUrl}`;
      ws = new WebSocket(fullWsUrl);
      wsRef.current = ws;

      ws.onopen = () => setWsConnected(true);
      ws.onmessage = e => handleMsg(e.data);
      ws.onerror = () => {
        ws?.close();
        wsRef.current = null;
        if (!finishedRef.current && !usedSSE) {
          usedSSE = true;
          fallbackSSE();
        }
      };
      ws.onclose = () => setWsConnected(false);
    } catch {
      fallbackSSE();
    }

    function fallbackSSE() {
      setWsConnected(false);
      const es = new EventSource(`/api/crews/stream/${encodeURIComponent(execId!)}`);
      es.onopen = () => setStreamFault(null);
      es.onmessage = e => handleMsg(e.data);
      es.onerror = () => {
        es.close();
        if (!finishedRef.current) {
          setStreamFault('Verbindung unterbrochen. Crew-API / CREW_API_URL prüfen.');
        }
      };
      wsRef.current = null;
      return () => es.close();
    }

    return () => {
      ws?.close();
      wsRef.current = null;
    };
  }, [execId, load]);

  const totalAgents = crews.reduce((s, c) => s + c.agents, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--layer-0)' }}>
      {/* CSS animations */}
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--layer-1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>🤖</div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Agent Teams</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              Crew AI · WebSocket + SSE {!crewApiOk && '(Crew-API Fallback)'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { icon: <Bot size={12} />, label: `${crews.length} Crews`, color: '#60a5fa' },
            { icon: <Zap size={12} />, label: `${totalAgents} Agents`, color: '#c084fc' },
            { icon: <Activity size={12} />, label: `${totalPieces} Outputs`, color: '#34d399' },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8,
              background: s.color + '12', border: `1px solid ${s.color}25`,
              fontSize: 11, fontWeight: 600, color: s.color,
            }}>
              {s.icon} {s.label}
            </div>
          ))}
          <button type="button" onClick={load} disabled={loading} title="Aktualisieren" style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--layer-2)',
            cursor: loading ? 'default' : 'pointer', color: 'var(--text-muted)', fontSize: 11,
          }}>
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Laden…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Error banner */}
        {error && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 10,
            border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.06)',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#fbbf24',
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Live Execution Panel */}
        {execId && (
          <LivePanel
            execId={execId} crewId={execCrewId} crewLabel={execLabel}
            timeline={timeline} agents={agentLive}
            wsConnected={wsConnected} streamFault={streamFault}
            onClose={closeStream}
          />
        )}

        {/* Robot legend */}
        <div style={{
          marginBottom: 20, padding: '12px 16px', borderRadius: 12,
          border: '1px solid var(--border)', background: 'var(--layer-1)',
        }}>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Agent-Charaktere
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Object.entries(ROBOTS).map(([role, r]) => (
              <div key={role} title={role} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px',
                borderRadius: 20, background: r.bgColor, border: `1px solid ${r.color}30`,
                cursor: 'default',
              }}>
                <span style={{ fontSize: 14 }}>{r.avatar}</span>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: r.color }}>{r.name}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 4 }}>· {r.trait}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crew Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
            Lade Crews…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {crews.map(c => (
              <CrewCard key={c.id} crew={c} onStarted={handleStarted} busy={!!execId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
