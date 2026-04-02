'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  RefreshCw, Play, Clock, FileText, Zap,
  CheckCircle2, Activity, AlertTriangle, XCircle, Radio, Bot, Wifi,
  Pencil, Search, TrendingUp, Database, Image, Shield,
  Target, BarChart3, Megaphone, Sparkles, Eye, Globe, Cpu,
} from 'lucide-react';
import { dashboardApiAuthHeaders } from '@/lib/dashboard-auth-headers';

// ── Professional Agent Profiles ──────────────────────────────────────────────

interface AgentProfile {
  role: string;
  model: string;
  icon: React.ElementType;
  color: string;
  specialties: string[];
}

const AGENT_PROFILES: Record<string, AgentProfile> = {
  'Content Researcher':        { role: 'Content Researcher',    model: 'Gemini 2.0',        icon: Search,      color: 'var(--accent-green)',  specialties: ['Recherche', 'Quellen', 'Analyse'] },
  'Writer & SEO':              { role: 'Writer & SEO',          model: 'Claude Sonnet',      icon: Pencil,      color: 'var(--accent-purple)', specialties: ['Blog', 'SEO', 'Copywriting'] },
  'Audience Analyst':          { role: 'Audience Analyst',      model: 'Gemini Flash',       icon: Target,      color: 'var(--accent-amber)',  specialties: ['Zielgruppen', 'Personas'] },
  'Opportunity Scorer':        { role: 'Opportunity Scorer',    model: 'Claude Haiku',       icon: TrendingUp,  color: 'var(--accent-red)',    specialties: ['Scoring', 'Priorisierung'] },
  'Trend Analyst':             { role: 'Trend Analyst',         model: 'Gemini 2.0',        icon: BarChart3,   color: 'var(--accent-blue)',   specialties: ['Trends', 'Forecasting'] },
  'Content Strategist':        { role: 'Content Strategist',    model: 'Claude Sonnet',      icon: Sparkles,    color: 'var(--accent-blue)',   specialties: ['Strategie', 'Planung'] },
  'Senior Researcher':         { role: 'Senior Researcher',     model: 'Gemini Pro',         icon: Search,      color: 'var(--accent-green)',  specialties: ['Deep Research', 'Synthese'] },
  'Synthesis Specialist':      { role: 'Synthesis Specialist',  model: 'Gemini Pro',         icon: Database,    color: 'var(--accent-amber)',  specialties: ['Integration', 'Reports'] },
  'Research Analyst':          { role: 'Research Analyst',      model: 'Claude Haiku',       icon: Search,      color: 'var(--accent-green)',  specialties: ['Quick Scan', 'Analyse'] },
  'Content Writer & SEO':      { role: 'Content Writer & SEO',  model: 'Claude Sonnet',      icon: Pencil,      color: 'var(--accent-purple)', specialties: ['Multichannel', 'SEO'] },
  'Viral Content Scout':       { role: 'Viral Content Scout',   model: 'Gemini Flash',       icon: Megaphone,   color: 'var(--accent-purple)', specialties: ['Viral', 'Social'] },
  'Fact Checker':              { role: 'Fact Checker',          model: 'Claude Opus',        icon: Shield,      color: 'var(--accent-red)',    specialties: ['Fakten', 'Quellen'] },
  'Resonance Checker':         { role: 'Resonance Checker',     model: 'Gemini Flash',       icon: Eye,         color: 'var(--accent-purple)', specialties: ['Resonanz', 'Engagement'] },
  'Speed Reviewer':            { role: 'Speed Reviewer',        model: 'Claude Haiku',       icon: Zap,         color: 'var(--accent-green)',  specialties: ['Quick Review', 'QA'] },
  'Trend Scout':               { role: 'Trend Scout',           model: 'Gemini 2.0',        icon: Globe,       color: 'var(--accent-blue)',   specialties: ['Markt', 'Wettbewerb'] },
  'Opportunity Evaluator':     { role: 'Opportunity Evaluator', model: 'Claude Sonnet',      icon: TrendingUp,  color: 'var(--accent-red)',    specialties: ['Bewertung', 'ROI'] },
  'Briefing Creator':          { role: 'Briefing Creator',      model: 'Gemini Pro',         icon: FileText,    color: 'var(--accent-green)',  specialties: ['Briefings', 'Summaries'] },
  'Director Agent':            { role: 'Director',              model: 'Claude Opus',        icon: Cpu,         color: 'var(--accent-amber)',  specialties: ['Orchestrierung', 'Routing'] },
  'Viral Trend Analyst':       { role: 'Viral Trend Analyst',   model: 'Grok-3',             icon: BarChart3,   color: 'var(--text-secondary)', specialties: ['X/Twitter', 'Viral'] },
  'Twitter/X Copywriter':      { role: 'X Copywriter',          model: 'Grok-3',             icon: Pencil,      color: 'var(--accent-blue)',   specialties: ['Tweets', 'Threads'] },
  'Multi-Platform Content Adapter': { role: 'Platform Adapter', model: 'Grok-3',             icon: Globe,       color: 'var(--accent-purple)', specialties: ['Multi-Platform', 'Adaption'] },
};

function getAgent(role: string): AgentProfile {
  return AGENT_PROFILES[role] ?? { role, model: 'Unknown', icon: Bot, color: 'var(--text-secondary)', specialties: [] };
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
    { role: 'Content Researcher', color: 'var(--accent-green)' },
    { role: 'Writer & SEO',       color: 'var(--accent-purple)' },
  ],
  niche_analysis_crew: [
    { role: 'Audience Analyst',   color: 'var(--accent-amber)' },
    { role: 'Opportunity Scorer', color: 'var(--accent-red)' },
  ],
  content_forecast_crew: [
    { role: 'Trend Analyst',      color: 'var(--accent-blue)' },
    { role: 'Content Strategist', color: 'var(--accent-blue)' },
  ],
  deep_research_crew: [
    { role: 'Senior Researcher',    color: 'var(--accent-green)' },
    { role: 'Synthesis Specialist', color: 'var(--accent-amber)' },
  ],
  quick_research_crew: [{ role: 'Research Analyst', color: 'var(--accent-green)' }],
  multichannel_fabrik_crew: [
    { role: 'Content Strategist',   color: 'var(--accent-blue)' },
    { role: 'Content Writer & SEO', color: 'var(--accent-purple)' },
    { role: 'Viral Content Scout',  color: 'var(--accent-purple)' },
  ],
  red_team_crew: [
    { role: 'Fact Checker',      color: 'var(--accent-red)' },
    { role: 'Resonance Checker', color: 'var(--accent-purple)' },
    { role: 'Speed Reviewer',    color: 'var(--accent-green)' },
  ],
  market_intelligence_crew: [
    { role: 'Trend Scout',            color: 'var(--accent-blue)' },
    { role: 'Opportunity Evaluator',  color: 'var(--accent-red)' },
    { role: 'Briefing Creator',       color: 'var(--accent-green)' },
  ],
  director_crew: [
    { role: 'Director Agent', color: 'var(--accent-amber)' },
  ],
  xai_social_crew: [
    { role: 'Viral Trend Analyst',              color: 'var(--text-secondary)' },
    { role: 'Twitter/X Copywriter',             color: 'var(--accent-blue)' },
    { role: 'Multi-Platform Content Adapter',   color: 'var(--accent-purple)' },
  ],
};

const CREW_ACCENT: Record<string, string> = {
  content_generation_crew:  'var(--accent-purple)',
  niche_analysis_crew:      'var(--accent-amber)',
  content_forecast_crew:    'var(--accent-blue)',
  deep_research_crew:       'var(--accent-green)',
  quick_research_crew:      'var(--accent-green)',
  multichannel_fabrik_crew: 'var(--accent-purple)',
  red_team_crew:            'var(--accent-red)',
  market_intelligence_crew: 'var(--accent-blue)',
  director_crew:            'var(--accent-amber)',
  xai_social_crew:          'var(--accent-blue)',
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
  xai_social_crew:          { topic: 'KI-Agenten verändern das Internet 2026', category: 'KI-Tools', target_platforms: 'twitter,linkedin,threads' },
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

// ── Agent Avatar (Professional) ──────────────────────────────────────────────

function AgentAvatar({
  role, status = 'idle', size = 44,
}: { role: string; status?: AgentStatus; size?: number }) {
  const a = getAgent(role);
  const Icon = a.icon;
  const pulse = status === 'working';
  const borderColor = status === 'working' ? a.color
    : status === 'done'  ? 'var(--accent-green)'
    : status === 'error' ? 'var(--accent-red)'
    : 'var(--border)';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {pulse && (
        <div style={{
          position: 'absolute', inset: -3, borderRadius: 12,
          border: `2px solid ${a.color}`,
          animation: 'ping 1.2s cubic-bezier(0,0,0.2,1) infinite',
          opacity: 0.5,
        }} />
      )}
      <div style={{
        width: size, height: size, borderRadius: 12,
        background: 'var(--layer-3)',
        border: `1.5px solid ${borderColor}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'border-color 0.3s',
        position: 'relative', zIndex: 1,
      }}>
        <Icon size={size * 0.42} style={{ color: a.color }} />
      </div>
    </div>
  );
}

// ── Agent Card (Professional) ────────────────────────────────────────────────

function AgentCard({ role, live }: { role: string; live?: AgentLive }) {
  const a = getAgent(role);
  const st = live?.status ?? 'idle';
  const statusLabel = st === 'working' ? 'Aktiv' : st === 'done' ? 'Fertig' : st === 'error' ? 'Fehler' : 'Bereit';
  const statusColor = st === 'working' ? 'var(--accent-amber)' : st === 'done' ? 'var(--accent-green)' : st === 'error' ? 'var(--accent-red)' : 'var(--text-muted)';

  return (
    <div style={{
      background: 'var(--layer-2)',
      border: `1px solid ${st !== 'idle' ? a.color + '40' : 'var(--border)'}`,
      borderRadius: 12, padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'border-color 0.3s, box-shadow 0.3s',
      boxShadow: st === 'working' ? `0 0 12px ${a.color}15` : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AgentAvatar role={role} status={st} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{a.role}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 1 }}>{a.model}</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 20,
          background: statusColor + '15', color: statusColor,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
          {statusLabel}
        </div>
      </div>

      {/* Specialties */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {a.specialties.map(s => (
          <span key={s} style={{
            fontSize: 9, padding: '2px 6px', borderRadius: 4,
            background: 'var(--layer-3)', color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}>
            {s}
          </span>
        ))}
      </div>

      {live?.taskId && (
        <div style={{
          background: 'var(--layer-3)', borderRadius: 8, padding: '6px 10px',
          borderLeft: `3px solid ${a.color}`,
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
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
      {agents.map((ag, i) => {
        const a = getAgent(ag.role);
        const Icon = a.icon;
        const live = activeAgents[ag.role];
        const st = live?.status ?? 'idle';
        const active = st === 'working';
        return (
          <div key={ag.role} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '6px 10px', borderRadius: 10,
              background: active ? a.color + '10' : 'transparent',
              border: `1px solid ${active ? a.color + '40' : 'transparent'}`,
              transition: 'all 0.3s',
            }}>
              <AgentAvatar role={ag.role} status={st} size={32} />
              <span style={{ fontSize: 9, color: active ? a.color : 'var(--text-muted)', fontWeight: 600, maxWidth: 64, textAlign: 'center', lineHeight: 1.2 }}>
                {a.role.split(' ')[0]}
              </span>
            </div>
            {i < agents.length - 1 && (
              <div style={{
                width: 20, height: 1,
                background: `linear-gradient(90deg, ${a.color}40, ${getAgent(agents[i + 1]?.role ?? '').color}40)`,
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
    k === 'ok' ? 'var(--accent-green)' : k === 'err' ? 'var(--accent-red)' : k === 'task' ? 'var(--accent-blue)' : 'var(--text-secondary)';

  return (
    <div ref={ref} style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 5, paddingRight: 2 }}>
      {entries.length === 0 && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', padding: '8px 0' }}>
          Warte auf Events…
        </div>
      )}
      {entries.map((e) => {
        const agentProfile = e.agentId ? getAgent(e.agentId) : null;
        const AgentIcon = agentProfile?.icon;
        return (
          <div key={e.id} style={{
            fontSize: 11, padding: '7px 10px', borderRadius: 8,
            background: 'var(--layer-2)', borderLeft: `3px solid ${color(e.kind)}`,
            display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            {AgentIcon && <AgentIcon size={13} style={{ color: agentProfile?.color, flexShrink: 0, marginTop: 1 }} />}
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <Radio size={14} style={{ color: 'var(--accent-green)', animation: 'pulse 1.2s ease-in-out infinite' }} />
        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>Live · {crewLabel}</span>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
          padding: '2px 8px', borderRadius: 10,
          background: wsConnected ? 'rgba(52,211,153,0.12)' : 'rgba(251,191,36,0.12)',
          border: `1px solid ${wsConnected ? 'rgba(52,211,153,0.25)' : 'rgba(251,191,36,0.25)'}`,
          color: wsConnected ? 'var(--accent-green)' : 'var(--accent-amber)',
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

      <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 10, background: 'var(--layer-2)', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          Crew Pipeline
        </div>
        <CrewFlowViz crewId={crewId} activeAgents={agents} />
      </div>

      {streamFault && (
        <div style={{
          marginBottom: 12, padding: '10px 12px', borderRadius: 8,
          border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.08)',
          fontSize: 11, color: 'var(--text-secondary)',
        }}>
          <strong style={{ color: 'var(--accent-red)' }}>Verbindungsfehler:</strong>
          <div style={{ marginTop: 4 }}>{streamFault}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 12 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Agenten ({crewAgents.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {crewAgents.map(ag => (
              <AgentCard key={ag.role} role={ag.role} live={agents[ag.role]} />
            ))}
            {Object.keys(agents)
              .filter(aid => !crewAgents.find(ag => ag.role === aid))
              .map(aid => <AgentCard key={aid} role={aid} live={agents[aid]} />)
            }
            {crewAgents.length === 0 && Object.keys(agents).length === 0 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Warte auf Agent-Events…</div>
            )}
          </div>
        </div>

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
        method: 'POST', headers: { 'Content-Type': 'application/json', ...dashboardApiAuthHeaders() },
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

  const label = st === 'running' ? 'Start…' : st === 'done' ? 'Gestartet' : st === 'err' ? 'Fehler' : 'Starten';
  const color = st === 'running' ? 'var(--accent-blue)' : st === 'done' ? 'var(--accent-green)' : st === 'err' ? 'var(--accent-red)' : 'var(--text-muted)';

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
  const accent = CREW_ACCENT[crew.id] ?? 'var(--accent-blue)';

  return (
    <div style={{
      background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 12,
      padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'border-color 0.2s',
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = accent + '50')}
    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: accent + '12', border: `1px solid ${accent}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {agents[0] ? (() => { const Icon = getAgent(agents[0].role).icon; return <Icon size={16} style={{ color: accent }} />; })() : <Bot size={16} style={{ color: accent }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{crew.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            {crew.agents} Agents · {crew.tasks} Tasks · {relTime(crew.last_run)}
          </div>
        </div>
        <RunButton crewId={crew.id} onStarted={onStarted} busy={busy} />
      </div>

      {/* Agent roster with roles + models */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {agents.map(ag => {
          const a = getAgent(ag.role);
          return (
            <div key={ag.role} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '3px 8px', borderRadius: 6,
              background: 'var(--layer-3)', border: '1px solid var(--border)',
            }}>
              {(() => { const Icon = a.icon; return <Icon size={10} style={{ color: a.color }} />; })()}
              <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 500 }}>{a.role}</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{a.model}</span>
            </div>
          );
        })}
      </div>

      {crew.recent_pieces.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                color: p.status === 'draft' ? 'var(--accent-amber)' : 'var(--accent-green)',
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
      const res = await fetch('/api/crews', { headers: { ...dashboardApiAuthHeaders() } });
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
          setTimeline(p => [...p, { id, at: ts, kind: 'task', title: 'Task gestartet', detail: String(msg.task_id ?? ''), agentId }]);
        }
        if (t === 'task_completed') {
          const out = String(msg.output ?? '').slice(0, 400);
          setAgentLive(p => ({ ...p, [agentId]: { status: 'done', taskId: String(msg.task_id ?? p[agentId]?.taskId ?? ''), output: out } }));
          setTimeline(p => [...p, { id, at: ts, kind: 'ok', title: 'Task abgeschlossen', detail: out.slice(0, 120), agentId }]);
        }
        if (t === 'execution_completed') {
          finishedRef.current = true;
          setTimeline(p => [...p, { id, at: ts, kind: 'ok', title: 'Crew fertig', detail: String(msg.result ?? '').slice(0, 200) }]);
          wsRef.current?.close();
          setTimeout(() => { setExecId(null); load(); }, 1600);
        }
        if (t === 'execution_error') {
          finishedRef.current = true;
          setTimeline(p => [...p, { id, at: ts, kind: 'err', title: 'Execution-Fehler', detail: String(msg.error ?? '') }]);
          wsRef.current?.close();
          setTimeout(() => setExecId(null), 2500);
        }
      } catch { /* ignore */ }
    }

    let ws: WebSocket | null = null;
    let usedSSE = false;

    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const fullWsUrl = `${proto}//${window.location.host}/api/crews/ws/${encodeURIComponent(execId)}`;
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
        background: 'var(--layer-1)', flexWrap: 'wrap', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(96,165,250,0.12)', border: '1px solid rgba(96,165,250,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={18} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Agent Teams</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              CrewAI · {crews.length} Crews · {totalAgents} Agents {!crewApiOk && '(Fallback)'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { icon: <Bot size={11} />, label: `${crews.length} Crews`, color: 'var(--accent-blue)' },
            { icon: <Zap size={11} />, label: `${totalAgents} Agents`, color: 'var(--accent-purple)' },
            { icon: <Activity size={11} />, label: `${totalPieces} Outputs`, color: 'var(--accent-green)' },
          ].map(s => (
            <div key={s.label} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 8,
              background: s.color + '10', border: `1px solid ${s.color}20`,
              fontSize: 11, fontWeight: 600, color: s.color,
            }}>
              {s.icon} {s.label}
            </div>
          ))}
          <button type="button" onClick={load} disabled={loading} title="Aktualisieren" style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8,
            border: '1px solid var(--border)', background: 'var(--layer-2)',
            cursor: loading ? 'default' : 'pointer', color: 'var(--text-muted)', fontSize: 11,
          }}>
            <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            {loading ? 'Laden…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto' }}>
        {error && (
          <div style={{
            marginBottom: 16, padding: '10px 14px', borderRadius: 10,
            border: '1px solid rgba(251,191,36,0.3)', background: 'rgba(251,191,36,0.06)',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--accent-amber)',
          }}>
            <AlertTriangle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {execId && (
          <LivePanel
            execId={execId} crewId={execCrewId} crewLabel={execLabel}
            timeline={timeline} agents={agentLive}
            wsConnected={wsConnected} streamFault={streamFault}
            onClose={closeStream}
          />
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
            Lade Crews…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 12 }}>
            {crews.map(c => (
              <CrewCard key={c.id} crew={c} onStarted={handleStarted} busy={!!execId} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
