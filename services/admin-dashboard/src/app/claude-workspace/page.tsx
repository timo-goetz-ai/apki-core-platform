'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, RefreshCw, Zap, ChevronDown, Bot, Sparkles,
  Code2, BookOpen, Terminal, ExternalLink, Copy, Check,
} from 'lucide-react';
import { MODELS, DEFAULT_MODEL, ORCHESTRATOR_AUTO, getModelsByProvider, type ModelInfo } from '@/lib/chat-models';

// ── Types ──────────────────────────────────────────────────────────────────────
type Role = 'user' | 'assistant';

interface Message {
  id: string;
  role: Role;
  content: string;
  isStreaming?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { label: 'Was läuft gerade?',        icon: Terminal },
  { label: 'Zeig alle Container',       icon: Code2 },
  { label: 'n8n Workflows auflisten',   icon: Zap },
  { label: 'Service-Status',            icon: RefreshCw },
  { label: 'Fehlerhafte Services',      icon: BookOpen },
];

const PROVIDERS = [
  { provider: 'openrouter' as const, label: '⚡ Free · OpenRouter', color: 'var(--text-muted)',    selBg: 'rgba(56,189,248,0.08)',  selBorder: 'rgba(56,189,248,0.2)',  selColor: '#38bdf8' },
  { provider: 'anthropic'  as const, label: '◆ Anthropic · Claude', color: 'var(--accent-amber)', selBg: 'rgba(251,191,36,0.08)',  selBorder: 'rgba(251,191,36,0.25)', selColor: '#fbbf24' },
  { provider: 'google'     as const, label: '◈ Google AI Studio',   color: '#34d399',             selBg: 'rgba(52,211,153,0.08)',  selBorder: 'rgba(52,211,153,0.25)', selColor: '#34d399' },
] as const;

// ── Markdown-lite renderer ─────────────────────────────────────────────────────
function renderContent(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let codeBlock: string[] = [];
  let inCode = false;

  lines.forEach((line, i) => {
    if (line.startsWith('```')) {
      if (inCode) {
        elements.push(
          <pre key={`code-${i}`} style={{
            margin: '8px 0', padding: '10px 14px', borderRadius: 8,
            background: 'var(--layer-3)', border: '1px solid var(--border-bright)',
            fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.6,
            color: 'var(--text-primary)', overflowX: 'auto', whiteSpace: 'pre',
          }}>{codeBlock.join('\n')}</pre>
        );
        codeBlock = [];
        inCode = false;
      } else {
        inCode = true;
      }
      return;
    }
    if (inCode) { codeBlock.push(line); return; }

    const isTool   = line.startsWith('🔧');
    const isH2     = line.startsWith('## ');
    const isH3     = line.startsWith('### ');
    const isBullet = line.startsWith('- ') || line.startsWith('* ');

    // inline bold
    const renderInline = (txt: string) => {
      const parts = txt.split(/\*\*(.*?)\*\*/g);
      return parts.map((p, j) => j % 2 === 1 ? <strong key={j} style={{ color: 'var(--text-primary)' }}>{p}</strong> : p);
    };

    if (isH2) {
      elements.push(<p key={i} style={{ margin: '10px 0 4px', fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{line.slice(3)}</p>);
    } else if (isH3) {
      elements.push(<p key={i} style={{ margin: '8px 0 3px', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{line.slice(4)}</p>);
    } else if (isBullet) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 6, margin: '2px 0', alignItems: 'flex-start' }}>
          <span style={{ color: '#38bdf8', marginTop: 3, flexShrink: 0 }}>·</span>
          <span style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (isTool) {
      elements.push(
        <span key={i} style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#fbbf24', margin: '3px 0' }}>{line}</span>
      );
    } else {
      elements.push(
        <span key={i} style={{ display: 'block', fontSize: 13, lineHeight: 1.7, color: line ? 'var(--text-secondary)' : 'transparent', minHeight: line ? 'auto' : '0.5em' }}>
          {line ? renderInline(line) : '\u00A0'}
        </span>
      );
    }
  });

  return elements;
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ClaudeWorkspacePage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hey — ich bin dein AIOS Assistent mit Zugriff auf alle Services, Docker-Container, Coolify-Apps und mehr.\n\nFrag mich z.B. **"Was läuft gerade?"**, **"Zeig alle Container"**, oder **"Starte Service XY neu."**',
    },
  ]);
  const [input, setInput]         = useState('');
  const [modelKey, setModelKey]   = useState<string>(ORCHESTRATOR_AUTO);
  const [modelOpen, setModelOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied]       = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const close = () => setModelOpen(false);
    if (modelOpen) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [modelOpen]);

  const currentModel = modelKey === ORCHESTRATOR_AUTO
    ? { label: 'Auto (Orchestrator)', free: true, tools: true, provider: 'openrouter' as const }
    : (MODELS[modelKey] ?? MODELS[DEFAULT_MODEL]);

  const sendMessage = useCallback(async (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg || streaming) return;

    const userMsg: Message     = { id: Date.now().toString(), role: 'user', content: msg };
    const assistantId          = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantId, role: 'assistant', content: '', isStreaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    const history = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }));
    history.push({ role: 'user', content: msg });

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, modelKey }),
      });
      if (!res.body) throw new Error('No stream');
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data) as { text: string };
            accumulated += parsed.text;
            setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: accumulated } : m));
          } catch { /* skip */ }
        }
      }
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m));
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

  const copyMsg = (content: string, id: string) => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 60px)', position: 'relative', zIndex: 1 }}>

      {/* ── Chat Panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border)' }}>

        {/* Header */}
        <div style={{
          padding: '14px 20px 12px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0, background: 'var(--layer-1)', backdropFilter: 'blur(8px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(52,211,153,0.2))',
              border: '1px solid rgba(56,189,248,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(56,189,248,0.1)',
            }}>
              <Bot size={16} style={{ color: '#38bdf8' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Claude Workspace</p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Tool-Calling · Docker · Services · Cloudflare
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Raycast AI link */}
            <a
              href="raycast://extensions/raycast/raycast-ai/ai-chat"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 10px', borderRadius: 8,
                background: 'rgba(255,99,99,0.08)', border: '1px solid rgba(255,99,99,0.2)',
                color: '#ff6363', fontSize: 11, fontFamily: 'var(--font-mono)', textDecoration: 'none',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,99,99,0.14)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,99,99,0.08)')}
            >
              <Zap size={10} />
              Raycast AI
              <ExternalLink size={9} />
            </a>

            <AnimatePresence>
              {streaming && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 999,
                    background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
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
                  display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                  background: 'var(--layer-2)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'var(--font-mono)', transition: 'border-color 0.12s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#38bdf8')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <Zap size={10} style={{ color: '#fbbf24' }} />
                {currentModel.label}
                {currentModel.free && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>FREE</span>}
                <ChevronDown size={9} style={{ transform: modelOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {modelOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)', width: 260,
                  background: 'var(--layer-2)', border: '1px solid var(--border-bright)',
                  borderRadius: 12, padding: 8, zIndex: 50, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  maxHeight: 420, overflowY: 'auto',
                }}>
                  <p style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color: '#22d3ee', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 4px 3px', marginBottom: 2, opacity: 0.85 }}>🔄 Auto · Orchestrator</p>
                  <button onClick={() => { setModelKey(ORCHESTRATOR_AUTO); setModelOpen(false); }} style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '5px 8px', borderRadius: 7, cursor: 'pointer', marginBottom: 8,
                    background: modelKey === ORCHESTRATOR_AUTO ? 'rgba(34,211,238,0.08)' : 'transparent',
                    border: modelKey === ORCHESTRATOR_AUTO ? '1px solid rgba(34,211,238,0.25)' : '1px solid transparent',
                    color: modelKey === ORCHESTRATOR_AUTO ? '#22d3ee' : '#94a3b8',
                    fontSize: 11, fontFamily: 'var(--font-mono)', textAlign: 'left',
                  }}>
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
                            color: key === modelKey ? selColor : 'var(--text-muted)',
                            fontSize: 11, fontFamily: 'var(--font-mono)', textAlign: 'left',
                          }}>
                            <span>{m.label}</span>
                            <div style={{ display: 'flex', gap: 3 }}>
                              {m.free  && <span style={{ fontSize: 8, padding: '1px 4px', borderRadius: 3, background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>FREE</span>}
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 12px' }}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              style={{ marginBottom: 20, display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: 10, alignItems: 'flex-start' }}
            >
              {msg.role === 'assistant' && (
                <div style={{
                  width: 30, height: 30, borderRadius: 9, flexShrink: 0,
                  background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(52,211,153,0.15))',
                  border: '1px solid rgba(56,189,248,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 2,
                }}>
                  <Sparkles size={13} style={{ color: '#38bdf8' }} />
                </div>
              )}
              <div style={{ maxWidth: '84%', position: 'relative' }}>
                <div style={{
                  padding: msg.role === 'user' ? '9px 14px' : '12px 16px',
                  borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '4px 14px 14px 14px',
                  background: msg.role === 'user' ? 'rgba(56,189,248,0.1)' : 'var(--layer-2)',
                  border: msg.role === 'user' ? '1px solid rgba(56,189,248,0.22)' : '1px solid var(--border)',
                  fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)',
                }}>
                  {renderContent(msg.content)}
                  {msg.isStreaming && (
                    <span style={{
                      display: 'inline-block', width: 8, height: 14, marginLeft: 3,
                      background: '#38bdf8', borderRadius: 2, verticalAlign: 'text-bottom',
                      animation: 'status-pulse 0.7s ease-in-out infinite',
                    }} />
                  )}
                </div>
                {msg.role === 'assistant' && !msg.isStreaming && msg.content && (
                  <button
                    onClick={() => copyMsg(msg.content, msg.id)}
                    style={{
                      position: 'absolute', bottom: -18, right: 0,
                      display: 'flex', alignItems: 'center', gap: 3,
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--text-muted)', fontSize: 9, fontFamily: 'var(--font-mono)',
                      padding: '2px 4px', transition: 'color 0.1s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  >
                    {copied === msg.id ? <><Check size={9} /> kopiert</> : <><Copy size={9} /> kopieren</>}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '12px 24px 16px', borderTop: '1px solid var(--border)',
          flexShrink: 0, background: 'var(--layer-1)',
        }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
            {QUICK_PROMPTS.map(q => {
              const Icon = q.icon;
              return (
                <button key={q.label} onClick={() => sendMessage(q.label)} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 12px', borderRadius: 999, border: '1px solid var(--border)',
                  background: 'var(--layer-2)', color: 'var(--text-muted)',
                  fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font-mono)', transition: 'all 0.12s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = '#38bdf8'; el.style.color = '#38bdf8'; el.style.background = 'rgba(56,189,248,0.06)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-muted)'; el.style.background = 'var(--layer-2)'; }}
                >
                  <Icon size={10} />
                  {q.label}
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Frag mich etwas… (Enter senden, Shift+Enter neue Zeile)"
              rows={2}
              style={{
                flex: 1, resize: 'none', padding: '10px 14px',
                background: 'var(--layer-2)', border: '1px solid var(--border)',
                borderRadius: 10, color: 'var(--text-primary)',
                fontSize: 13, fontFamily: 'var(--font-ui)', lineHeight: 1.5,
                outline: 'none', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = '#38bdf8')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || streaming}
              style={{
                width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                background: input.trim() && !streaming ? '#38bdf8' : 'var(--layer-3)',
                border: 'none', cursor: input.trim() && !streaming ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
              }}
            >
              <Send size={15} style={{ color: input.trim() && !streaming ? '#fff' : 'var(--text-muted)' }} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Model List ── */}
      <div style={{ width: 240, overflowY: 'auto', padding: '20px 16px', flexShrink: 0 }}>
        <p style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
          Modelle · {Object.keys(MODELS).length + 1}
        </p>

        {/* Auto */}
        <button onClick={() => setModelKey(ORCHESTRATOR_AUTO)} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '7px 10px', borderRadius: 8, cursor: 'pointer', marginBottom: 12,
          background: modelKey === ORCHESTRATOR_AUTO ? 'rgba(34,211,238,0.08)' : 'var(--layer-2)',
          border: modelKey === ORCHESTRATOR_AUTO ? '1px solid rgba(34,211,238,0.25)' : '1px solid var(--border)',
          transition: 'all 0.12s', textAlign: 'left',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 4px #22d3ee', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: modelKey === ORCHESTRATOR_AUTO ? '#22d3ee' : 'var(--text-secondary)' }}>Auto</span>
          </div>
          <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(34,211,238,0.15)', color: '#22d3ee' }}>ROUTING</span>
        </button>

        {PROVIDERS.map(({ provider, label, color, selBg, selBorder, selColor }) => {
          const entries = getModelsByProvider(provider);
          if (!entries.length) return null;
          return (
            <div key={provider} style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 8, fontFamily: 'var(--font-mono)', color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 5, opacity: 0.85 }}>{label}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {entries.map(([key, m]) => (
                  <button key={key} onClick={() => setModelKey(key)} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                    background: key === modelKey ? selBg : 'transparent',
                    border: key === modelKey ? `1px solid ${selBorder}` : '1px solid transparent',
                    transition: 'all 0.12s', textAlign: 'left',
                  }}
                  onMouseEnter={e => { if (key !== modelKey) { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'var(--layer-2)'; el.style.borderColor = 'var(--border)'; } }}
                  onMouseLeave={e => { if (key !== modelKey) { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'transparent'; el.style.borderColor = 'transparent'; } }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 3px #34d399', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: key === modelKey ? selColor : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{m.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                      {m.free  && <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 3, background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>FREE</span>}
                      {m.tools && <span style={{ fontSize: 7, padding: '1px 4px', borderRadius: 3, background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>TOOLS</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        {/* Raycast AI shortcut */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>External</p>
          <a
            href="raycast://extensions/raycast/raycast-ai/ai-chat"
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8,
              background: 'rgba(255,99,99,0.08)', border: '1px solid rgba(255,99,99,0.2)',
              color: '#ff6363', textDecoration: 'none', transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,99,99,0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,99,99,0.08)')}
          >
            <Zap size={13} />
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Raycast AI</p>
              <p style={{ margin: 0, fontSize: 9, color: 'rgba(255,99,99,0.7)' }}>AI Workspace öffnen</p>
            </div>
            <ExternalLink size={10} style={{ marginLeft: 'auto' }} />
          </a>
        </div>
      </div>
    </div>
  );
}
