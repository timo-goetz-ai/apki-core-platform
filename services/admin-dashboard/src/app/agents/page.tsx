'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Bot, RefreshCw, Play, Clock, FileText, Users, Zap, CheckCircle2,
  Activity, AlertTriangle, XCircle, Radio,
} from 'lucide-react';

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
}

type AgentLive = { status: 'idle' | 'working' | 'done' | 'error'; taskId?: string; output?: string };

// ── Static agent roster (crews.yaml) ──────────────────────────────────────────

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
  quick_research_crew: [{ role: 'Research Analyst', color: '#34d399' }],
};

const CREW_ICON_COLOR: Record<string, string> = {
  content_generation_crew: '#a78bfa',
  niche_analysis_crew: '#34d399',
  content_forecast_crew: '#fb923c',
  deep_research_crew: '#60a5fa',
  quick_research_crew: '#fbbf24',
};

/** Default Inputs pro Crew-ID → POST /crews/{id}/start */
const DEFAULT_CREW_INPUTS: Record<string, Record<string, string>> = {
  content_generation_crew: {
    topic: 'KI-Agenten 2026',
    category: 'KI-Tools',
    target_platforms: 'blog',
  },
  niche_analysis_crew: { topic: 'Nischen-Analyse', category: 'Markt', target_platforms: 'internal' },
  content_forecast_crew: { topic: 'Content-Trends', category: 'Prognose', target_platforms: 'blog' },
  deep_research_crew: { topic: 'Deep Research', category: 'Research', target_platforms: 'blog' },
  quick_research_crew: { topic: 'Quick Scan', category: 'Research', target_platforms: 'blog' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function prettyCrewName(id: string): string {
  return id
    .split('_')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

function buildFallbackCrews(): Crew[] {
  return Object.keys(CREW_AGENTS).map((id) => ({
    id,
    name: prettyCrewName(id),
    agents: CREW_AGENTS[id].length,
    tasks: CREW_AGENTS[id].length,
    last_run: null,
    recent_pieces: [],
  }));
}

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

function tlColor(k: TimelineEntry['kind']): string {
  if (k === 'ok') return '#34d399';
  if (k === 'err') return '#f87171';
  if (k === 'task') return '#60a5fa';
  return '#94a3b8';
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function AgentChip({ role, color }: { role: string; color: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 8px',
        borderRadius: 6,
        background: `${color}14`,
        border: `1px solid ${color}30`,
      }}
    >
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color, fontWeight: 500 }}>{role}</span>
    </div>
  );
}

function CrewApiRunButton({
  crewId,
  onStarted,
  busy,
}: {
  crewId: string;
  onStarted: (executionId: string, label: string) => void;
  busy: boolean;
}) {
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'err'>('idle');

  async function run() {
    if (state === 'running' || busy) return;
    setState('running');
    try {
      const inputs = DEFAULT_CREW_INPUTS[crewId] ?? {
        topic: 'Demo',
        category: 'Allgemein',
        target_platforms: 'blog',
      };
      const res = await fetch(`/api/crews/${encodeURIComponent(crewId)}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputs),
      });
      const data = (await res.json().catch(() => ({}))) as { execution_id?: string; detail?: string };
      if (res.ok && data.execution_id) {
        setState('done');
        onStarted(String(data.execution_id), prettyCrewName(crewId));
        setTimeout(() => setState('idle'), 800);
      } else {
        setState('err');
        setTimeout(() => setState('idle'), 2500);
      }
    } catch {
      setState('err');
      setTimeout(() => setState('idle'), 2500);
    }
  }

  const label =
    state === 'running' ? 'Start…' : state === 'done' ? 'OK' : state === 'err' ? 'Fehler' : 'Crew API';
  const bg =
    state === 'running'
      ? 'rgba(96,165,250,0.12)'
      : state === 'done'
        ? 'rgba(52,211,153,0.12)'
        : state === 'err'
          ? 'rgba(248,113,113,0.12)'
          : 'var(--layer-3)';
  const bdr =
    state === 'running'
      ? '#60a5fa'
      : state === 'done'
        ? '#34d399'
        : state === 'err'
          ? '#f87171'
          : 'var(--border-bright)';

  return (
    <button
      type="button"
      onClick={run}
      disabled={state === 'running' || busy}
      title="Crew über Crew-API starten (Live-Stream)"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 6,
        border: `1px solid ${bdr}`,
        background: bg,
        cursor: state === 'running' || busy ? 'default' : 'pointer',
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--text-secondary)',
        transition: 'all 0.15s',
      }}
    >
      <Play size={9} />
      {label}
    </button>
  );
}

function LiveExecutionPanel({
  executionId,
  crewLabel,
  timeline,
  agents,
  streamFault,
  onClose,
}: {
  executionId: string;
  crewLabel: string;
  timeline: TimelineEntry[];
  agents: Record<string, AgentLive>;
  streamFault?: string | null;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        marginBottom: 20,
        padding: '14px 16px',
        borderRadius: 12,
        border: '1px solid rgba(96,165,250,0.25)',
        background: 'linear-gradient(135deg, rgba(96,165,250,0.08), rgba(15,23,42,0.4))',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <Radio size={14} style={{ color: '#34d399', animation: 'pulse 1.2s ease-in-out infinite' }} />
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>Live · {crewLabel}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', flex: 1, minWidth: 200 }}>
          {executionId}
        </span>
        <button
          type="button"
          onClick={onClose}
          style={{
            fontSize: 10,
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--layer-2)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
        >
          Stream schließen
        </button>
      </div>

      {streamFault ? (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 12px',
            borderRadius: 8,
            border: '1px solid rgba(248,113,113,0.45)',
            background: 'rgba(248,113,113,0.1)',
            fontSize: 11,
            color: '#fecaca',
            lineHeight: 1.4,
          }}
        >
          <strong style={{ color: '#f87171' }}>Stream / Verbindung</strong>
          <div style={{ marginTop: 4 }}>{streamFault}</div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(200px,0.9fr)', gap: 14 }}>
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Timeline (SSE)
          </div>
          <div
            style={{
              maxHeight: 200,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              paddingRight: 4,
            }}
          >
            {timeline.length === 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Warte auf Events…</span>
            )}
            {timeline.map((e) => (
              <div
                key={e.id}
                style={{
                  fontSize: 11,
                  padding: '6px 8px',
                  borderRadius: 8,
                  background: 'var(--layer-2)',
                  borderLeft: `3px solid ${tlColor(e.kind)}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.title}</span>
                  <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flexShrink: 0 }}>
                    {new Date(e.at).toLocaleTimeString('de-DE')}
                  </span>
                </div>
                {e.detail && (
                  <div style={{ marginTop: 4, fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', wordBreak: 'break-word' }}>
                    {e.detail}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Agenten
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.keys(agents).length === 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Noch keine Task-Events</span>
            )}
            {Object.entries(agents).map(([aid, st]) => (
              <div
                key={aid}
                style={{
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'var(--layer-2)',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  {st.status === 'working' && <Activity size={12} style={{ color: '#fbbf24' }} />}
                  {st.status === 'done' && <CheckCircle2 size={12} style={{ color: '#34d399' }} />}
                  {st.status === 'error' && <XCircle size={12} style={{ color: '#f87171' }} />}
                  {st.status === 'idle' && <Clock size={12} style={{ color: 'var(--text-muted)' }} />}
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{aid}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-muted)', marginLeft: 'auto' }}>{st.taskId}</span>
                </div>
                {st.output && (
                  <p style={{ margin: 0, fontSize: 10, color: 'var(--text-secondary)', lineHeight: 1.35 }}>{st.output}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CrewCard({
  crew,
  onCrewStarted,
  streamBusy,
}: {
  crew: Crew;
  onCrewStarted: (executionId: string, label: string) => void;
  streamBusy: boolean;
}) {
  const agents = CREW_AGENTS[crew.id] ?? [];
  const accent = CREW_ICON_COLOR[crew.id] ?? '#60a5fa';

  return (
    <div
      style={{
        background: 'var(--layer-2)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 0.15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            flexShrink: 0,
            background: `${accent}18`,
            border: `1px solid ${accent}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Users size={16} style={{ color: accent }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{crew.name}</span>
            <span
              style={{
                fontSize: 10,
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              {crew.agents} Agents · {crew.tasks} Tasks
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Clock size={9} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{relTime(crew.last_run)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
          <CrewApiRunButton crewId={crew.id} onStarted={onCrewStarted} busy={streamBusy} />
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {agents.map((a) => (
          <AgentChip key={a.role} role={a.role} color={a.color} />
        ))}
      </div>

      {crew.recent_pieces.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <span
            style={{
              fontSize: 10,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 600,
            }}
          >
            Letzte Outputs
          </span>
          {crew.recent_pieces.map((p) => (
            <div key={p.piece_id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <FileText size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-secondary)',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {p.title ?? p.piece_id}
              </span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: p.status === 'draft' ? 'rgba(251,191,36,0.12)' : 'rgba(52,211,153,0.12)',
                  color: p.status === 'draft' ? '#fbbf24' : '#34d399',
                }}
              >
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
  const [crewApiOk, setCrewApiOk] = useState(true);

  const [streamExecId, setStreamExecId] = useState<string | null>(null);
  const [streamLabel, setStreamLabel] = useState('');
  const [streamFault, setStreamFault] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [agentLive, setAgentLive] = useState<Record<string, AgentLive>>({});
  const finishedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/crews');
      const data = await res.json();
      if (!res.ok) {
        setCrews(buildFallbackCrews());
        setTotalPieces(0);
        setCrewApiOk(false);
        setError(data.error ?? 'Crew-API eingeschränkt — Fallback-Crews');
        return;
      }
      let list: Crew[] = data.crews ?? [];
      if (!list.length) {
        list = buildFallbackCrews();
        setCrewApiOk(!!data.crew_api_reachable);
        if (!data.crew_api_reachable) {
          setError('Crew-API lieferte keine Crews — zeige lokale Konfiguration. Prüfe CREW_API_URL.');
        }
      } else {
        setCrewApiOk(data.crew_api_reachable !== false);
      }
      setCrews(list);
      setTotalPieces(data.total_pieces ?? 0);
    } catch (e) {
      setCrews(buildFallbackCrews());
      setCrewApiOk(false);
      setError(e instanceof Error ? e.message : 'Netzwerkfehler — Fallback-Crews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCrewStarted = useCallback((executionId: string, label: string) => {
    finishedRef.current = false;
    setStreamFault(null);
    setTimeline([]);
    setAgentLive({});
    setStreamLabel(label);
    setStreamExecId(executionId);
  }, []);

  const closeStream = useCallback(() => {
    setStreamExecId(null);
    setStreamFault(null);
    setTimeline([]);
    setAgentLive({});
  }, []);

  useEffect(() => {
    if (!streamExecId) return;

    const es = new EventSource(`/api/crews/stream/${encodeURIComponent(streamExecId)}`);

    es.onopen = () => setStreamFault(null);

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data) as Record<string, unknown>;
        const t = String(msg.type ?? '');
        const ts = new Date().toISOString();
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

        if (t === 'execution_started') {
          setTimeline((prev) => [
            ...prev,
            { id, at: ts, kind: 'info', title: 'Execution gestartet', detail: String(msg.crew_id ?? '') },
          ]);
        }
        if (t === 'task_started') {
          const aid = String(msg.agent_id ?? 'agent');
          setAgentLive((p) => ({ ...p, [aid]: { ...p[aid], status: 'working', taskId: String(msg.task_id ?? '') } }));
          setTimeline((prev) => [...prev, { id, at: ts, kind: 'task', title: `Task ${msg.task_id}`, detail: aid }]);
        }
        if (t === 'task_completed') {
          const aid = String(msg.agent_id ?? 'agent');
          const out = String(msg.output ?? '').slice(0, 400);
          setAgentLive((p) => ({
            ...p,
            [aid]: { status: 'done', taskId: String(msg.task_id ?? p[aid]?.taskId ?? ''), output: out },
          }));
          setTimeline((prev) => [...prev, { id, at: ts, kind: 'ok', title: 'Task abgeschlossen', detail: out }]);
        }
        if (t === 'execution_completed') {
          finishedRef.current = true;
          const result = String(msg.result ?? '').slice(0, 300);
          setTimeline((prev) => [...prev, { id, at: ts, kind: 'ok', title: 'Crew fertig', detail: result }]);
          es.close();
          setTimeout(() => {
            setStreamExecId(null);
            load();
          }, 1400);
        }
        if (t === 'execution_error') {
          finishedRef.current = true;
          setTimeline((prev) => [
            ...prev,
            { id, at: ts, kind: 'err', title: 'Execution-Fehler', detail: String(msg.error ?? '') },
          ]);
          es.close();
          setTimeout(() => setStreamExecId(null), 2500);
        }
      } catch {
        /* ignore malformed chunk */
      }
    };

    es.onerror = () => {
      es.close();
      if (!finishedRef.current) {
        const detail =
          'Netzwerk, Timeout oder Upstream-Fehler (502). Crew-API / CREW_API_URL prüfen — Stream bleibt offen bis «Stream schließen».';
        setStreamFault(detail);
        setTimeline((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            at: new Date().toISOString(),
            kind: 'err',
            title: 'SSE Verbindung abgebrochen',
            detail,
          },
        ]);
      }
    };

    return () => {
      es.close();
    };
  }, [streamExecId, load]);

  const totalAgents = crews.reduce((s, c) => s + c.agents, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--layer-0)' }}>
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--layer-1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(96,165,250,0.12)',
              border: '1px solid rgba(96,165,250,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={16} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Agent Teams</h1>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              Crew AI · Live via SSE {!crewApiOk && '(Crew-API Fallback aktiv)'}
            </p>
          </div>
        </div>
        <button
          onClick={load}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 10px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--layer-2)',
            cursor: 'pointer',
            fontSize: 11,
            color: 'var(--text-secondary)',
          }}
        >
          <RefreshCw size={11} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Aktualisieren
        </button>
      </div>

      {!loading && crews.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: 0,
            borderBottom: '1px solid var(--border)',
            background: 'var(--layer-1)',
          }}
        >
          {[
            { icon: <Users size={12} />, label: 'Crews', value: crews.length, color: 'var(--accent-blue)' },
            { icon: <Bot size={12} />, label: 'Agents total', value: totalAgents, color: '#a78bfa' },
            { icon: <FileText size={12} />, label: 'Pieces (NocoDB)', value: totalPieces, color: '#34d399' },
            {
              icon: crewApiOk ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />,
              label: 'Crew-API',
              value: crewApiOk ? 'OK' : 'Fallback',
              color: crewApiOk ? '#34d399' : '#fbbf24',
            },
          ].map((k, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: '10px 20px',
                borderRight: i < 3 ? '1px solid var(--border)' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
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

      <div style={{ padding: '24px' }}>
        {error && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              background: 'rgba(251,191,36,0.08)',
              border: '1px solid rgba(251,191,36,0.25)',
              color: '#fbbf24',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {streamExecId && (
          <LiveExecutionPanel
            executionId={streamExecId}
            crewLabel={streamLabel}
            timeline={timeline}
            agents={agentLive}
            streamFault={streamFault}
            onClose={closeStream}
          />
        )}

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: 180,
                  borderRadius: 12,
                  background: 'var(--layer-2)',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {crews.map((crew) => (
                <CrewCard
                  key={crew.id}
                  crew={crew}
                  onCrewStarted={handleCrewStarted}
                  streamBusy={!!streamExecId}
                />
              ))}
            </div>

            <div
              style={{
                marginTop: 24,
                padding: '10px 16px',
                borderRadius: 8,
                background: 'var(--layer-2)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Zap size={12} style={{ color: '#fbbf24' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Live-Stream: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>GET /api/crews/stream/[executionId]</span>{' '}
                → Crew-API SSE. Start: <span style={{ fontFamily: 'var(--font-mono)' }}>POST /api/crews/[crewId]/start</span>. Env:{' '}
                <span style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>CREW_API_URL</span>
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
