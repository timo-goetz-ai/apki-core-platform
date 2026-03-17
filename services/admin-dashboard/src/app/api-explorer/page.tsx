'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Code2, Copy, Check, ExternalLink, Download,
  FileText,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'WS';

interface Endpoint {
  method: HttpMethod;
  path: string;
  desc: string;
  latency?: string;
}

interface EndpointGroup {
  group: string;
  endpoints: Endpoint[];
}

// ── Data ──────────────────────────────────────────────────────────────────────
const API_ENDPOINTS: EndpointGroup[] = [
  {
    group: 'Health & Status',
    endpoints: [
      { method: 'GET',  path: '/health',   desc: 'System health check',             latency: '~12ms' },
      { method: 'GET',  path: '/metrics',  desc: 'Prometheus metrics endpoint',     latency: '~8ms'  },
      { method: 'GET',  path: '/version',  desc: 'API version and build info',      latency: '~4ms'  },
    ],
  },
  {
    group: 'Agents',
    endpoints: [
      { method: 'GET',    path: '/api/agents',        desc: 'List all registered agents'    },
      { method: 'POST',   path: '/api/agents',        desc: 'Register new agent'             },
      { method: 'GET',    path: '/api/agents/{id}',   desc: 'Get agent details by ID'        },
      { method: 'PUT',    path: '/api/agents/{id}',   desc: 'Update agent configuration'     },
      { method: 'DELETE', path: '/api/agents/{id}',   desc: 'Deregister agent'               },
    ],
  },
  {
    group: 'Tasks',
    endpoints: [
      { method: 'GET',  path: '/api/tasks',         desc: 'List all tasks with status'      },
      { method: 'POST', path: '/api/tasks',         desc: 'Create new task'                 },
      { method: 'GET',  path: '/api/tasks/{id}',    desc: 'Get task status and result'      },
      { method: 'POST', path: '/api/tasks/{id}/cancel', desc: 'Cancel a running task'      },
    ],
  },
  {
    group: 'Models & AI',
    endpoints: [
      { method: 'GET',  path: '/api/models',        desc: 'List available AI models'        },
      { method: 'POST', path: '/api/chat',           desc: 'Chat completions (SSE streaming)', latency: 'stream' },
      { method: 'POST', path: '/api/chat/sync',      desc: 'Synchronous chat (no streaming)' },
      { method: 'POST', path: '/api/embeddings',     desc: 'Generate text embeddings'        },
    ],
  },
  {
    group: 'Automations',
    endpoints: [
      { method: 'GET',  path: '/api/automations',               desc: 'List all n8n workflows'        },
      { method: 'GET',  path: '/api/automations/{id}',          desc: 'Get workflow details'           },
      { method: 'POST', path: '/api/automations/{id}/trigger',  desc: 'Trigger a workflow execution'  },
      { method: 'GET',  path: '/api/automations/{id}/runs',     desc: 'Get execution history'          },
    ],
  },
  {
    group: 'Services',
    endpoints: [
      { method: 'GET',  path: '/api/services',       desc: 'Get status of all services',    latency: '~50ms' },
      { method: 'GET',  path: '/api/services/{id}',  desc: 'Get single service status'       },
    ],
  },
  {
    group: 'WebSocket',
    endpoints: [
      { method: 'WS', path: '/ws/dashboard',    desc: 'Live dashboard updates feed'    },
      { method: 'WS', path: '/ws/chat/{id}',    desc: 'Real-time chat stream channel'  },
      { method: 'WS', path: '/ws/logs',         desc: 'Live log streaming'             },
    ],
  },
];

const METHOD_STYLE: Record<HttpMethod, { bg: string; border: string; color: string }> = {
  GET:    { bg: 'rgba(56,189,248,0.12)',  border: 'rgba(56,189,248,0.25)',  color: '#38bdf8' },
  POST:   { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)',  color: '#34d399' },
  PUT:    { bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.25)',  color: '#fbbf24' },
  DELETE: { bg: 'rgba(248,113,113,0.12)',border: 'rgba(248,113,113,0.25)', color: '#f87171' },
  WS:     { bg: 'rgba(167,139,250,0.12)',border: 'rgba(167,139,250,0.25)', color: '#a78bfa' },
};

const BASE_URL = 'https://api.automation-plus-ki.de';

function MethodBadge({ method }: { method: HttpMethod }) {
  const s = METHOD_STYLE[method];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 52, padding: '2px 8px', borderRadius: 5,
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
      color: s.color, letterSpacing: '0.04em',
    }}>
      {method}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 26, height: 26, borderRadius: 6, cursor: 'pointer',
        background: 'rgba(22,27,34,0.6)', border: '1px solid rgba(148,163,184,0.1)',
        color: copied ? '#34d399' : '#475569', transition: 'all 0.15s',
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!copied) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(148,163,184,0.25)'; el.style.color = '#94a3b8'; } }}
      onMouseLeave={e => { if (!copied) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(148,163,184,0.1)'; el.style.color = '#475569'; } }}
      title="Copy full URL"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } };

export default function ApiExplorerPage() {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? API_ENDPOINTS.map(group => ({
        ...group,
        endpoints: group.endpoints.filter(ep =>
          ep.path.toLowerCase().includes(search.toLowerCase()) ||
          ep.desc.toLowerCase().includes(search.toLowerCase()) ||
          ep.method.toLowerCase().includes(search.toLowerCase())
        ),
      })).filter(g => g.endpoints.length > 0)
    : API_ENDPOINTS;

  const totalEndpoints = API_ENDPOINTS.reduce((acc, g) => acc + g.endpoints.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '28px 28px 48px', position: 'relative', zIndex: 1 }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(56,189,248,0.15))',
              border: '1px solid rgba(52,211,153,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Code2 size={17} style={{ color: '#34d399' }} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                API Explorer
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: '#475569', fontFamily: 'var(--font-mono)' }}>
                {BASE_URL} · {totalEndpoints} Endpoints
              </p>
            </div>
          </div>

          {/* Quick action buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { label: 'Swagger UI', icon: <ExternalLink size={12} />, href: `${BASE_URL}/docs` },
              { label: 'ReDoc',      icon: <FileText size={12} />,     href: `${BASE_URL}/redoc` },
              { label: 'OpenAPI',    icon: <Download size={12} />,     href: `${BASE_URL}/openapi.json` },
            ].map(btn => (
              <a
                key={btn.label}
                href={btn.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                  background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(148,163,184,0.1)',
                  color: '#94a3b8', fontSize: 12, fontWeight: 500, textDecoration: 'none',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'rgba(56,189,248,0.3)'; el.style.color = '#38bdf8'; el.style.background = 'rgba(56,189,248,0.06)'; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'rgba(148,163,184,0.1)'; el.style.color = '#94a3b8'; el.style.background = 'rgba(22,27,34,0.8)'; }}
              >
                {btn.icon}
                {btn.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 24, position: 'relative' }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Endpoint suchen…  z.B. /api/agents oder GET"
          style={{
            width: '100%', padding: '10px 14px 10px 40px',
            background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(148,163,184,0.1)',
            borderRadius: 10, color: '#f1f5f9', fontSize: 13,
            fontFamily: 'var(--font-mono)', outline: 'none',
            transition: 'border-color 0.15s', boxSizing: 'border-box',
          }}
          onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#38bdf8'}
          onBlur={e => (e.target as HTMLInputElement).style.borderColor = 'rgba(148,163,184,0.1)'}
        />
        <Code2 size={14} style={{
          position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
          color: '#475569', pointerEvents: 'none',
        }} />
      </div>

      {/* Method legend */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {(Object.entries(METHOD_STYLE) as [HttpMethod, typeof METHOD_STYLE[HttpMethod]][]).map(([method, s]) => (
          <span key={method} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '3px 10px', borderRadius: 6,
            background: s.bg, border: `1px solid ${s.border}`,
            fontSize: 10, fontWeight: 700, color: s.color,
            fontFamily: 'var(--font-mono)',
          }}>
            {method}
          </span>
        ))}
      </div>

      {/* Endpoint groups */}
      <motion.div variants={container} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {filtered.map(group => (
          <motion.div key={group.group} variants={item}>
            {/* Group header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {group.group}
              </span>
              <div style={{ flex: 1, height: 1, background: 'rgba(148,163,184,0.08)' }} />
              <span style={{ fontSize: 9, color: '#475569', fontFamily: 'var(--font-mono)' }}>
                {group.endpoints.length} endpoints
              </span>
            </div>

            {/* Endpoints */}
            <div style={{
              background: 'rgba(22,27,34,0.7)', border: '1px solid rgba(148,163,184,0.08)',
              borderRadius: 10, overflow: 'hidden',
            }}>
              {group.endpoints.map((ep, idx) => (
                <div
                  key={`${ep.method}-${ep.path}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 16px',
                    borderBottom: idx < group.endpoints.length - 1 ? '1px solid rgba(148,163,184,0.05)' : 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'rgba(148,163,184,0.03)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
                >
                  <MethodBadge method={ep.method} />
                  <code style={{
                    flex: '0 0 auto', minWidth: 200,
                    fontSize: 12, fontFamily: 'var(--font-mono)',
                    color: '#f1f5f9',
                  }}>
                    {ep.path}
                  </code>
                  <span style={{
                    flex: 1, fontSize: 12, color: '#94a3b8',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {ep.desc}
                  </span>
                  {ep.latency && (
                    <span style={{
                      fontSize: 10, fontFamily: 'var(--font-mono)', color: '#475569',
                      padding: '2px 7px', borderRadius: 4,
                      background: 'rgba(148,163,184,0.05)',
                      flexShrink: 0,
                    }}>
                      {ep.latency}
                    </span>
                  )}
                  <CopyButton text={`${BASE_URL}${ep.path}`} />
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          Keine Endpoints gefunden für &ldquo;{search}&rdquo;
        </div>
      )}
    </motion.div>
  );
}
