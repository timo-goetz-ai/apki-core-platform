'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Send, RefreshCw, Zap, ChevronDown,
  Server, Activity, Cpu, TrendingUp,
  CheckCircle2, AlertTriangle, XCircle, Minus,
  Wrench, Sparkles, Bot,
} from 'lucide-react';
import { MODELS, DEFAULT_MODEL, getModelsByProvider, type ModelInfo } from '@/lib/chat-models';

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
  online: 'var(--accent-green)', degraded: 'var(--accent-amber)',
  offline: 'var(--accent-red)',  unknown: 'var(--text-muted)',
};
const STATUS_ICON: Record<ServiceStatus, React.ReactNode> = {
  online:   <CheckCircle2 size={9} />,
  degraded: <AlertTriangle size={9} />,
  offline:  <XCircle size={9} />,
  unknown:  <Minus size={9} />,
};
const CORE_SERVICES = [
  { id: 'n8n',        name: 'n8n'        },
  { id: 'nocodb',     name: 'NocoDB'     },
  { id: 'grafana',    name: 'Grafana'    },
  { id: 'coolify',    name: 'Coolify'    },
  { id: 'authentik',  name: 'Authentik'  },
  { id: 'qdrant',     name: 'Qdrant'     },
  { id: 'redis',      name: 'Redis'      },
  { id: 'postgres',   name: 'PostgreSQL' },
  { id: 'prometheus', name: 'Prometheus' },
  { id: 'traefik',    name: 'Traefik'    },
  { id: 'cloudflare', name: 'Cloudflare' },
  { id: 'appflowy',   name: 'AppFlowy'   },
];

// ── Model badge ────────────────────────────────────────────────────────────────
function ModelBadge({ m, selected }: { m: ModelInfo; selected?: boolean }) {
  const isLocal = m.provider === 'ollama';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 10px', borderRadius: 8,
      background: selected ? 'rgba(56,189,248,0.07)' : 'var(--layer-2)',
      border: selected ? '1px solid rgba(56,189,248,0.25)' : '1px solid var(--border)',
      transition: 'border-color 0.12s',
    }}
    onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-bright)'; }}
    onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: isLocal ? 'var(--accent-purple)' : 'var(--accent-green)',
          boxShadow: `0 0 4px ${isLocal ? 'var(--accent-purple)' : 'var(--accent-green)'}`,
          flexShrink: 0,
        }} />
        <div>
          <span style={{ fontSize: 11, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', display: 'block' }}>
            {m.label}
          </span>
          {m.description && (
            <span style={{ fontSize: 9, color: 'var(--text-muted)', display: 'block', marginTop: 1 }}>
              {m.description}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        {isLocal && (
          <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(167,139,250,0.15)', color: 'var(--accent-purple)', letterSpacing: '0.05em' }}>LOCAL</span>
        )}
        {m.free && !isLocal && (
          <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(251,191,36,0.15)', color: 'var(--accent-amber)', letterSpacing: '0.05em' }}>FREE</span>
        )}
        {m.tools && (
          <span style={{ fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, background: 'rgba(56,189,248,0.12)', color: 'var(--accent-blue)', letterSpacing: '0.05em' }}>TOOLS</span>
        )}
      </div>
    </div>
  );
}

// ── Service row ────────────────────────────────────────────────────────────────
function ServiceRow({ name, status, latency }: { name: string; status: ServiceStatus; latency?: string }) {
  const color = STATUS_COLOR[status];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '5px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: status === 'online' ? `0 0 5px ${color}` : 'none', animation: status === 'online' ? 'status-pulse 2.5s ease-in-out infinite' : 'none' }} />
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
  const [modelKey, setModelKey] = useState(DEFAULT_MODEL);
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
  const currentModel = MODELS[modelKey] ?? MODELS[DEFAULT_MODEL];

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

  // ── Render message content (simple markdown) ──
  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, i) => {
      const isTool = line.startsWith('🔧');
      const isCode = line.startsWith('```');
      return (
        <span key={i} style={{
          display: 'block',
          color: isTool ? 'var(--accent-amber)' : isCode ? 'var(--accent-blue)' : 'inherit',
          fontFamily: isTool ? 'var(--font-mono)' : 'inherit',
          fontSize: isTool ? 11 : 'inherit',
        }}>
          {line || '\u00A0'}
        </span>
      );
    });
  };

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 90px)',
      position: 'relative', zIndex: 1,
      animation: 'fade-up 0.25s ease both',
    }}>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* LEFT — Chat Panel                                          */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={{
        flex: '0 0 58%', display: 'flex', flexDirection: 'column',
        borderRight: '1px solid var(--border)',
      }}>

        {/* Chat header */}
        <div style={{
          padding: '16px 20px 12px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(52,211,153,0.2))',
              border: '1px solid rgba(56,189,248,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bot size={14} style={{ color: 'var(--accent-blue)' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                AIOS Assistant
              </p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Tool-Calling aktiv · Docker · Services · Cloudflare
              </p>
            </div>
          </div>

          {/* Model selector */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={e => { e.stopPropagation(); setModelOpen(o => !o); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                background: 'var(--layer-2)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)',
                transition: 'border-color 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-blue)'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'}
            >
              <Zap size={10} style={{ color: 'var(--accent-amber)' }} />
              {currentModel.label}
              {currentModel.free && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: 'rgba(251,191,36,0.15)', color: 'var(--accent-amber)' }}>FREE</span>}
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
                {([
                  { provider: 'openrouter' as const, label: '⚡ Free Tier · OpenRouter', accent: 'var(--text-muted)',    selBg: 'rgba(56,189,248,0.08)',   selBorder: 'rgba(56,189,248,0.2)',   selColor: 'var(--accent-blue)' },
                  { provider: 'anthropic'  as const, label: '◆ Anthropic · Claude',      accent: 'var(--accent-amber)', selBg: 'rgba(251,191,36,0.08)',   selBorder: 'rgba(251,191,36,0.25)',  selColor: 'var(--accent-amber)' },
                  { provider: 'google'     as const, label: '◈ Google · AI Studio',      accent: '#34d399',             selBg: 'rgba(52,211,153,0.08)',   selBorder: 'rgba(52,211,153,0.25)', selColor: '#34d399' },
                  { provider: 'ollama'     as const, label: '⬡ Lokal · Hetzner',         accent: 'var(--accent-purple)', selBg: 'rgba(167,139,250,0.1)',  selBorder: 'rgba(167,139,250,0.3)',  selColor: 'var(--accent-purple)' },
                ] as const).map(({ provider, label, accent, selBg, selBorder, selColor }) => {
                  const entries = getModelsByProvider(provider);
                  if (!entries.length) return null;
                  return (
                    <div key={provider}>
                      <p style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 4px 3px', marginBottom: 2, opacity: 0.85 }}>{label}</p>
                      {entries.map(([key, m]) => (
                        <button key={key} onClick={() => { setModelKey(key); setModelOpen(false); }} style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '5px 8px', borderRadius: 7, cursor: 'pointer', marginBottom: 2,
                          background: key === modelKey ? selBg : 'transparent',
                          border: key === modelKey ? `1px solid ${selBorder}` : '1px solid transparent',
                          color: key === modelKey ? selColor : 'var(--text-secondary)',
                          fontSize: 11, fontFamily: 'var(--font-mono)', transition: 'all 0.1s', textAlign: 'left',
                        }}
                        onMouseEnter={e => { if (key !== modelKey) { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'var(--layer-3)'; el.style.color = 'var(--text-primary)'; } }}
                        onMouseLeave={e => { if (key !== modelKey) { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'transparent'; el.style.color = 'var(--text-secondary)'; } }}
                        >
                          <span>{m.label}</span>
                          <div style={{ display: 'flex', gap: 3 }}>
                            {m.provider === 'ollama' && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: 'rgba(167,139,250,0.15)', color: 'var(--accent-purple)' }}>LOCAL</span>}
                            {m.free && m.provider !== 'ollama' && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: 'rgba(251,191,36,0.15)', color: 'var(--accent-amber)' }}>FREE</span>}
                            {m.tools && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: 'rgba(56,189,248,0.12)', color: 'var(--accent-blue)' }}>TOOLS</span>}
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

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 12px' }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              marginBottom: 20,
              display: 'flex',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              gap: 10, alignItems: 'flex-start',
            }}>
              {/* Avatar */}
              {msg.role !== 'user' && (
                <div style={{
                  width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(56,189,248,0.25), rgba(52,211,153,0.15))',
                  border: '1px solid rgba(56,189,248,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginTop: 2,
                }}>
                  <Sparkles size={12} style={{ color: 'var(--accent-blue)' }} />
                </div>
              )}

              {/* Bubble */}
              <div style={{
                maxWidth: '82%',
                padding: msg.role === 'user' ? '8px 14px' : '10px 14px',
                borderRadius: msg.role === 'user' ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                background: msg.role === 'user'
                  ? 'rgba(56,189,248,0.12)'
                  : 'var(--layer-2)',
                border: msg.role === 'user'
                  ? '1px solid rgba(56,189,248,0.25)'
                  : '1px solid var(--border)',
                fontSize: 13, lineHeight: 1.65,
                color: 'var(--text-primary)',
              }}>
                {renderContent(msg.content)}
                {msg.isStreaming && (
                  <span style={{
                    display: 'inline-block', width: 8, height: 14, marginLeft: 2,
                    background: 'var(--accent-blue)', borderRadius: 1,
                    animation: 'status-pulse 0.8s ease-in-out infinite', verticalAlign: 'text-bottom',
                  }} />
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 20px 16px', borderTop: '1px solid var(--border)',
          flexShrink: 0,
        }}>
          {/* Quick prompts */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {['Was läuft gerade?', 'Zeig alle Container', 'Service-Status', 'Fehlerhafte Services'].map(q => (
              <button key={q} onClick={() => setInput(q)} style={{
                padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border)',
                background: 'var(--layer-2)', color: 'var(--text-muted)',
                fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'var(--accent-blue)'; el.style.color = 'var(--accent-blue)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-muted)'; }}
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
                background: 'var(--layer-2)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text-primary)',
                fontSize: 13, fontFamily: 'var(--font-ui)', lineHeight: 1.5,
                outline: 'none', transition: 'border-color 0.12s',
              }}
              onFocus={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--accent-blue)'}
              onBlur={e => (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || streaming}
              style={{
                width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                background: input.trim() && !streaming ? 'var(--accent-blue)' : 'var(--layer-3)',
                border: 'none', cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
            >
              <Send size={15} style={{ color: input.trim() && !streaming ? '#fff' : 'var(--text-muted)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* RIGHT — Status Panel                                       */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 32px' }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {[
            { label: 'Online', value: `${onlineCount}/${totalCount}`, icon: <Server size={13} />, color: 'rgba(52,211,153,0.5)' },
            { label: 'Workflows', value: '17',   icon: <Activity size={13} />, color: 'rgba(56,189,248,0.5)' },
            { label: 'AI Modelle', value: `${Object.keys(MODELS).length}`,  icon: <Cpu size={13} />,      color: 'rgba(167,139,250,0.5)' },
            { label: 'Uptime',    value: '99.8%', icon: <TrendingUp size={13} />, color: 'rgba(52,211,153,0.5)' },
          ].map(kpi => (
            <div key={kpi.label} style={{
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '14px 16px', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${kpi.color}, transparent)` }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kpi.label}</span>
                <span style={{ color: kpi.color, opacity: 0.7 }}>{kpi.icon}</span>
              </div>
              <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{kpi.value}</span>
            </div>
          ))}
        </div>

        {/* Verfügbare Modelle */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Verfügbare Modelle
            </span>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--accent-green)' }}>
              {Object.keys(MODELS).length} total
            </span>
          </div>

          {([
            { provider: 'openrouter' as const, label: '⚡ Free Tier · OpenRouter', color: 'var(--text-muted)' },
            { provider: 'anthropic'  as const, label: '◆ Anthropic · Claude',      color: 'var(--accent-amber)' },
            { provider: 'google'     as const, label: '◈ Google · AI Studio',      color: '#34d399' },
            { provider: 'ollama'     as const, label: '⬡ Lokal · Hetzner',         color: 'var(--accent-purple)' },
          ] as const).map(({ provider, label, color }) => {
            const entries = getModelsByProvider(provider);
            if (!entries.length) return null;
            return (
              <div key={provider} style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, opacity: 0.85 }}>{label}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {entries.map(([key, m]) => (
                    <div key={key} onClick={() => setModelKey(key)} style={{ cursor: 'pointer' }}>
                      <ModelBadge m={m} selected={key === modelKey} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Core Services */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Core Services
            </span>
            <button
              onClick={fetchStatuses}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10,
                fontFamily: 'var(--font-mono)', padding: 0,
              }}
            >
              <RefreshCw size={9} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
              refresh
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
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
    </div>
  );
}
