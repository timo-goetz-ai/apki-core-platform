'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, RefreshCw, Zap, ChevronDown,
  Server, Activity, Cpu, TrendingUp,
  CheckCircle2, AlertTriangle, XCircle, Minus,
  Sparkles, Bot, Workflow,
} from 'lucide-react';
import { MODELS, DEFAULT_MODEL, ORCHESTRATOR_AUTO, getModelsByProvider, type ModelInfo } from '@/lib/chat-models';

// ── Types ──────────────────────────────────────────────────────────────────────
type ServiceStatus = 'online' | 'degraded' | 'offline' | 'unknown';
type Role = 'user' | 'assistant' | 'tool';

interface Message {
  id: string;
  role: Role;
  content: string;
  isStreaming?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<ServiceStatus, string> = {
  online: '#34d399', degraded: '#fbbf24',
  offline: '#f87171', unknown: '#475569',
};
const STATUS_ICON: Record<ServiceStatus, React.ReactNode> = {
  online:   <CheckCircle2 size={9} />,
  degraded: <AlertTriangle size={9} />,
  offline:  <XCircle size={9} />,
  unknown:  <Minus size={9} />,
};
const CORE_SERVICES = [
  { id: 'n8n',        name: 'n8n Workflows'  },
  { id: 'nocodb',     name: 'NocoDB'         },
  { id: 'grafana',    name: 'Grafana'        },
  { id: 'coolify',    name: 'Coolify'        },
  { id: 'authentik',  name: 'Authentik SSO'  },
  { id: 'qdrant',     name: 'Qdrant'         },
  { id: 'redis',      name: 'Redis'          },
  { id: 'postgres',   name: 'PostgreSQL'     },
  { id: 'prometheus', name: 'Prometheus'     },
  { id: 'traefik',    name: 'Traefik'        },
  { id: 'cloudflare', name: 'Cloudflare'     },
];

const QUICK_PROMPTS = [
  'Was läuft gerade?',
  'Zeig alle Container',
  'Service-Status',
  'Fehlerhafte Services',
  'n8n Workflows auflisten',
];

// ── Provider config ────────────────────────────────────────────────────────────
const PROVIDERS = [
  { provider: 'openrouter' as const, label: '⚡ Free · OpenRouter', color: 'var(--text-muted)',    selBg: 'rgba(56,189,248,0.08)',   selBorder: 'rgba(56,189,248,0.2)',   selColor: '#38bdf8' },
  { provider: 'anthropic'  as const, label: '◆ Anthropic · Claude', color: 'var(--accent-amber)', selBg: 'rgba(251,191,36,0.08)',   selBorder: 'rgba(251,191,36,0.25)',  selColor: '#fbbf24' },
  { provider: 'google'     as const, label: '◈ Google AI Studio',   color: '#34d399',              selBg: 'rgba(52,211,153,0.08)',   selBorder: 'rgba(52,211,153,0.25)',  selColor: '#34d399' },
] as const;

// ── Service row ────────────────────────────────────────────────────────────────
function ServiceRow({ name, status, latency }: { name: string; status: ServiceStatus; latency?: string }) {
  const color = STATUS_COLOR[status];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.05)',
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0,
        boxShadow: status === 'online' ? `0 0 6px ${color}` : 'none',
        animation: status === 'online' ? 'status-pulse 2.5s ease-in-out infinite' : 'none',
      }} />
      <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{name}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontFamily: 'var(--font-mono)', color }}>
        {STATUS_ICON[status]}
        {latency ?? status}
      </span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function CockpitPage() {
  // ── Chat state ──
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hey — ich bin dein AIOS Assistent. Ich habe Zugriff auf alle Services, Docker-Container, Coolify-Apps und mehr.\n\nFrag mich z.B.: *"Was läuft gerade?"*, *"Zeig alle Container"*, oder *"Starte Service XY neu."*',
    },
  ]);
  const [input, setInput] = useState('');
  const [modelKey, setModelKey] = useState<string>(ORCHESTRATOR_AUTO);
  const [modelOpen, setModelOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Status state ──
  const [statuses, setStatuses] = useState<Record<string, { status: ServiceStatus; latency?: string }>>({});
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatuses = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/services');
      if (res.ok) setStatuses(await res.json());
    } catch { /* silent */ }
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  useEffect(() => {
    fetchStatuses();
    const t = setInterval(fetchStatuses, 30_000);
    return () => clearInterval(t);
  }, [fetchStatuses]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const close = () => setModelOpen(false);
    if (modelOpen) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [modelOpen]);

  const getStatus  = (id: string): ServiceStatus => statuses[id]?.status ?? 'unknown';
  const getLatency = (id: string) => statuses[id]?.latency;
  const onlineCount = Object.values(statuses).filter(s => s.status === 'online').length;
  const totalCount  = Object.keys(statuses).length || CORE_SERVICES.length;
  const currentModel = modelKey === ORCHESTRATOR_AUTO
    ? { label: 'Auto (Orchestrator)', free: true, tools: true, provider: 'openrouter' as const }
    : (MODELS[modelKey] ?? MODELS[DEFAULT_MODEL]);

  // ── Send message ──
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', isStreaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: text });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, modelKey }),
      });

      if (!res.body) throw new Error('No stream');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data) as { text: string };
            accumulated += parsed.text;
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, content: accumulated } : m
            ));
          } catch { /* skip */ }
        }
      }
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, isStreaming: false } : m
      ));
    } catch (e) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: `[Fehler: ${String(e)}]`, isStreaming: false } : m
      ));
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages, modelKey]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // ── Render message content ──
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const isTool = line.startsWith('🔧');
      const isCode = line.startsWith('```');
      return (
        <span key={i} style={{
          display: 'block',
          color: isTool ? '#fbbf24' : isCode ? '#38bdf8' : 'inherit',
          fontFamily: isTool ? 'var(--font-mono)' : 'inherit',
          fontSize: isTool ? 11 : 'inherit',
        }}>
          {line || '\u00A0'}
        </span>
      );
    });
  };

  // ── KPI config ──
  const KPI_CARDS = [
    { label: 'Services Online', value: `${onlineCount}/${totalCount}`, sub: 'Alle Dienste', icon: <Server size={14} />, color: '#34d399', glow: 'rgba(52,211,153,0.15)' },
    { label: 'Workflows',       value: '17',                           sub: 'n8n aktiv',    icon: <Workflow size={14} />, color: '#38bdf8', glow: 'rgba(56,189,248,0.15)' },
    { label: 'MCPs',            value: '19',                           sub: 'Verbunden',    icon: <Cpu size={14} />,    color: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
    { label: 'Uptime',          value: '99.8%',                        sub: '30-Tage-Avg',  icon: <TrendingUp size={14} />, color: '#34d399', glow: 'rgba(52,211,153,0.15)' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex', height: 'calc(100vh - 60px)',
        position: 'relative', zIndex: 1,
      }}
    >

      {/* ══════════════════════════════════════════════════════════ */}
      {/* LEFT — Chat Panel                                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={{
        flex: '0 0 58%', display: 'flex', flexDirection: 'column',
        borderRight: '1px solid var(--border)',
      }}>

        {/* Chat header */}
        <div style={{
          padding: '14px 20px 12px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, background: 'rgba(13,17,23,0.6)', backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Avatar */}
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(52,211,153,0.2))',
              border: '1px solid rgba(56,189,248,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(56,189,248,0.1)',
            }}>
              <Bot size={15} style={{ color: '#38bdf8' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
                AIOS Assistant
              </p>
              <p style={{ margin: 0, fontSize: 10, color: '#475569', fontFamily: 'var(--font-mono)' }}>
                Tool-Calling · Docker · Services · Cloudflare
              </p>
            </div>
          </div>

          {/* Streaming indicator + Model selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AnimatePresence>
              {streaming && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '3px 9px', borderRadius: 999,
                    background: 'rgba(56,189,248,0.1)',
                    border: '1px solid rgba(56,189,248,0.2)',
                    fontSize: 10, color: '#38bdf8', fontFamily: 'var(--font-mono)',
                  }}
                >
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#38bdf8', animation: 'status-pulse 0.8s ease-in-out infinite' }} />
                  streaming
                </motion.div>
              )}
            </AnimatePresence>

            {/* Model selector */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={e => { e.stopPropagation(); setModelOpen(o => !o); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                  background: 'var(--layer-2)', border: '1px solid var(--border)',
                  color: '#94a3b8', fontSize: 11, fontFamily: 'var(--font-mono)',
                  transition: 'border-color 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = '#38bdf8'}
                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'}
              >
                <Zap size={10} style={{ color: '#fbbf24' }} />
                {currentModel.label}
                {currentModel.free && (
                  <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>FREE</span>
                )}
                <ChevronDown size={9} style={{ transform: modelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {modelOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                  width: 260, background: 'var(--layer-2)', border: '1px solid var(--border-bright)',
                  borderRadius: 12, padding: 8, zIndex: 50,
                  boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                  maxHeight: 420, overflowY: 'auto',
                }}>
                  {/* Auto-Orchestrator Option */}
                  <p style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 4px 3px', marginBottom: 2, opacity: 0.85 }}>🔄 Auto · Orchestrator</p>
                  <button onClick={() => { setModelKey(ORCHESTRATOR_AUTO); setModelOpen(false); }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 8px', borderRadius: 7, cursor: 'pointer', marginBottom: 8,
                    background: modelKey === ORCHESTRATOR_AUTO ? 'rgba(34,211,238,0.08)' : 'transparent',
                    border: modelKey === ORCHESTRATOR_AUTO ? '1px solid rgba(34,211,238,0.25)' : '1px solid transparent',
                    color: modelKey === ORCHESTRATOR_AUTO ? '#22d3ee' : '#94a3b8',
                    fontSize: 11, fontFamily: 'var(--font-mono)', transition: 'all 0.1s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (modelKey !== ORCHESTRATOR_AUTO) { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'var(--layer-3)'; el.style.color = '#f1f5f9'; } }}
                  onMouseLeave={e => { if (modelKey !== ORCHESTRATOR_AUTO) { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'transparent'; el.style.color = '#94a3b8'; } }}
                  >
                    <span>Auto — OpenRouter · Claude · Gemini</span>
                    <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>ROUTING</span>
                  </button>
                  <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 6px' }} />
                  {PROVIDERS.map(({ provider, label, color, selBg, selBorder, selColor }) => {
                    const entries = getModelsByProvider(provider);
                    if (!entries.length) return null;
                    return (
                      <div key={provider}>
                        <p style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 4px 3px', marginBottom: 2, opacity: 0.85 }}>{label}</p>
                        {entries.map(([key, m]) => (
                          <button key={key} onClick={() => { setModelKey(key); setModelOpen(false); }} style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '5px 8px', borderRadius: 7, cursor: 'pointer', marginBottom: 2,
                            background: key === modelKey ? selBg : 'transparent',
                            border: key === modelKey ? `1px solid ${selBorder}` : '1px solid transparent',
                            color: key === modelKey ? selColor : '#94a3b8',
                            fontSize: 11, fontFamily: 'var(--font-mono)', transition: 'all 0.1s', textAlign: 'left',
                          }}
                          onMouseEnter={e => { if (key !== modelKey) { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'var(--layer-3)'; el.style.color = '#f1f5f9'; } }}
                          onMouseLeave={e => { if (key !== modelKey) { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'transparent'; el.style.color = '#94a3b8'; } }}
                          >
                            <span>{m.label}</span>
                            <div style={{ display: 'flex', gap: 3 }}>
                              {m.free && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>FREE</span>}
                              {m.tools && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>TOOLS</span>}
                            </div>
                          </button>
                        ))}
                        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 6px' }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 12px' }}>
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: idx === 0 ? 0 : 0 }}
              style={{
                marginBottom: 18,
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                gap: 10, alignItems: 'flex-start',
              }}
            >
              {/* Avatar */}
              {msg.role !== 'user' && (
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(52,211,153,0.15))',
                  border: '1px solid rgba(56,189,248,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 2,
                }}>
                  <Sparkles size={12} style={{ color: '#38bdf8' }} />
                </div>
              )}

              {/* Bubble */}
              <div style={{
                maxWidth: '82%',
                padding: msg.role === 'user' ? '9px 14px' : '11px 14px',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user'
                  ? 'rgba(56,189,248,0.1)'
                  : 'rgba(22,27,34,0.9)',
                border: msg.role === 'user'
                  ? '1px solid rgba(56,189,248,0.22)'
                  : '1px solid rgba(148,163,184,0.08)',
                backdropFilter: 'blur(8px)',
                fontSize: 13, lineHeight: 1.65,
                color: '#f1f5f9',
              }}>
                {renderContent(msg.content)}
                {msg.isStreaming && (
                  <span style={{
                    display: 'inline-block', width: 8, height: 14, marginLeft: 3,
                    background: '#38bdf8', borderRadius: 2,
                    animation: 'status-pulse 0.7s ease-in-out infinite', verticalAlign: 'text-bottom',
                  }} />
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{
          padding: '12px 20px 16px', borderTop: '1px solid var(--border)',
          flexShrink: 0, background: 'rgba(13,17,23,0.5)', backdropFilter: 'blur(8px)',
        }}>
          {/* Quick prompts */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {QUICK_PROMPTS.map(q => (
              <button key={q} onClick={() => setInput(q)} style={{
                padding: '4px 12px', borderRadius: 999, border: '1px solid var(--border)',
                background: 'rgba(22,27,34,0.6)', color: '#94a3b8',
                fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                transition: 'all 0.12s', whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = '#38bdf8'; el.style.color = '#38bdf8'; el.style.background = 'rgba(56,189,248,0.06)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'var(--border)'; el.style.color = '#94a3b8'; el.style.background = 'rgba(22,27,34,0.6)'; }}
              >{q}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Frag mich etwas über dein System… (Enter zum Senden)"
              rows={2}
              style={{
                flex: 1, resize: 'none', padding: '10px 14px',
                background: 'rgba(22,27,34,0.8)', border: '1px solid var(--border)',
                borderRadius: 10, color: '#f1f5f9',
                fontSize: 13, fontFamily: 'var(--font-ui)', lineHeight: 1.5,
                outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = '#38bdf8'}
              onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: input.trim() && !streaming ? '#38bdf8' : 'var(--layer-3)',
                border: 'none', cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s, transform 0.1s',
                transform: 'scale(1)',
              }}
              onMouseEnter={e => { if (input.trim() && !streaming) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'}
            >
              <Send size={15} style={{ color: input.trim() && !streaming ? '#fff' : '#475569' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* RIGHT — Status Panel                                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 32px' }}>

        {/* KPI row */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}
        >
          {KPI_CARDS.map(kpi => (
            <motion.div
              key={kpi.label}
              variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
              style={{
                background: 'rgba(22,27,34,0.9)', border: '1px solid rgba(148,163,184,0.08)',
                borderRadius: 12, padding: '16px', position: 'relative', overflow: 'hidden',
              }}
            >
              {/* Top accent line */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${kpi.color}50, transparent)` }} />
              {/* Subtle glow bg */}
              <div style={{ position: 'absolute', top: -20, right: -20, width: 60, height: 60, background: kpi.glow, borderRadius: '50%', filter: 'blur(20px)', pointerEvents: 'none' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.09em' }}>{kpi.label}</span>
                <span style={{ color: kpi.color, opacity: 0.8 }}>{kpi.icon}</span>
              </div>
              <span style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f1f5f9', display: 'block' }}>{kpi.value}</span>
              <span style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-mono)' }}>{kpi.sub}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Available Models */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Verfügbare Modelle
            </span>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#34d399' }}>
              {Object.keys(MODELS).length + 1} gesamt
            </span>
          </div>

          {/* Auto Orchestrator */}
          <div style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, opacity: 0.85 }}>🔄 Auto · Orchestrator</p>
            <button onClick={() => setModelKey(ORCHESTRATOR_AUTO)} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
              background: modelKey === ORCHESTRATOR_AUTO ? 'rgba(34,211,238,0.08)' : 'rgba(22,27,34,0.6)',
              border: modelKey === ORCHESTRATOR_AUTO ? '1px solid rgba(34,211,238,0.25)' : '1px solid rgba(148,163,184,0.06)',
              transition: 'all 0.12s', textAlign: 'left',
            }}
            onMouseEnter={e => { if (modelKey !== ORCHESTRATOR_AUTO) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(148,163,184,0.16)'; el.style.background = 'rgba(22,27,34,0.9)'; } }}
            onMouseLeave={e => { if (modelKey !== ORCHESTRATOR_AUTO) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(148,163,184,0.06)'; el.style.background = 'rgba(22,27,34,0.6)'; } }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#22d3ee',
                  boxShadow: '0 0 4px #22d3ee',
                  flexShrink: 0,
                }} />
                <span style={{ fontSize: 11, color: modelKey === ORCHESTRATOR_AUTO ? '#22d3ee' : '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                  Auto — OpenRouter · Claude · Gemini
                </span>
              </div>
              <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>ROUTING</span>
            </button>
          </div>

          {PROVIDERS.map(({ provider, label, color, selBg, selBorder, selColor }) => {
            const entries = getModelsByProvider(provider);
            if (!entries.length) return null;
            return (
              <div key={provider} style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, opacity: 0.85 }}>{label}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {entries.map(([key, m]) => (
                    <button key={key} onClick={() => setModelKey(key)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                      background: key === modelKey ? selBg : 'rgba(22,27,34,0.6)',
                      border: key === modelKey ? `1px solid ${selBorder}` : '1px solid rgba(148,163,184,0.06)',
                      transition: 'all 0.12s', textAlign: 'left',
                    }}
                    onMouseEnter={e => { if (key !== modelKey) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(148,163,184,0.16)'; el.style.background = 'rgba(22,27,34,0.9)'; } }}
                    onMouseLeave={e => { if (key !== modelKey) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(148,163,184,0.06)'; el.style.background = 'rgba(22,27,34,0.6)'; } }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: '#34d399',
                          boxShadow: '0 0 4px #34d399',
                          flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 11, color: key === modelKey ? selColor : '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                          {m.label}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 3 }}>
                        {m.free && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>FREE</span>}
                        {m.tools && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>TOOLS</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Core Services */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Core Services
            </span>
            <button
              onClick={fetchStatuses}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#475569', display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 10, fontFamily: 'var(--font-mono)', padding: 0,
                transition: 'color 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#475569'}
            >
              <RefreshCw size={9} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
              refresh
            </button>
          </div>
          <div style={{
            background: 'rgba(22,27,34,0.6)', borderRadius: 10,
            border: '1px solid rgba(148,163,184,0.06)', padding: '8px 12px',
            display: 'flex', flexDirection: 'column',
          }}>
            {CORE_SERVICES.map(svc => (
              <ServiceRow
                key={svc.id}
                name={svc.name}
                status={getStatus(svc.id)}
                latency={getLatency(svc.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
