'use client';
import { useState } from 'react';
import { Play, CheckCircle, ExternalLink, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { dashboardApiAuthHeaders } from '@/lib/dashboard-auth-headers';

interface ApiRoute {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  testable?: boolean;
}

const API_CATEGORIES: Array<{ category: string; routes: ApiRoute[] }> = [
  {
    category: 'Monitoring',
    routes: [
      { method: 'GET', path: '/api/monitoring/grafana', description: 'Grafana Daten', testable: true },
      { method: 'GET', path: '/api/monitoring/prometheus', description: 'Prometheus Targets', testable: true },
    ],
  },
  {
    category: 'Services & Docker',
    routes: [
      { method: 'GET', path: '/api/services', description: 'Service Health', testable: true },
      { method: 'GET', path: '/api/docker/containers', description: 'Container Liste', testable: true },
    ],
  },
  {
    category: 'LLM / Chat',
    routes: [
      { method: 'GET', path: '/api/chat', description: 'Modelle abrufen', testable: true },
    ],
  },
  {
    category: 'Coolify',
    routes: [
      { method: 'GET', path: '/api/coolify/services', description: 'Coolify Services', testable: true },
    ],
  },
  {
    category: 'Cloudflare',
    routes: [
      { method: 'GET', path: '/api/cloudflare/zones', description: 'DNS Zones', testable: true },
    ],
  },
  {
    category: 'Integrationen',
    routes: [
      { method: 'GET', path: '/api/n8n/webhooks', description: 'n8n Webhooks', testable: true },
      { method: 'GET', path: '/api/github/stats', description: 'GitHub Stats', testable: true },
      { method: 'GET', path: '/api/config-status', description: 'Konfiguration Status', testable: true },
    ],
  },
  {
    category: 'NocoDB',
    routes: [
      { method: 'GET', path: '/api/nocodb/agents', description: 'Agents', testable: true },
      { method: 'GET', path: '/api/nocodb/workflows', description: 'Workflows', testable: true },
    ],
  },
];

const EXTERNAL_LINKS = [
  { label: 'Grafana', url: 'https://grafana.automation-plus-ki.de', desc: 'Monitoring & Dashboards' },
  { label: 'n8n', url: 'https://n8n.automation-plus-ki.de', desc: 'Workflow Automation' },
  { label: 'NocoDB', url: 'https://nocodb.automation-plus-ki.de', desc: 'Datenbank UI' },
  { label: 'Prometheus', url: 'https://prometheus.automation-plus-ki.de', desc: 'Metriken' },
  { label: 'Coolify', url: 'https://coolify.automation-plus-ki.de', desc: 'Deployments' },
  { label: 'Authentik', url: 'https://auth.automation-plus-ki.de', desc: 'SSO' },
];

type RouteState = { status: 'idle' | 'loading' | 'ok' | 'error'; response?: string; code?: number };

export default function ToolsPage() {
  const [results, setResults] = useState<Record<string, RouteState>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const run = async (path: string) => {
    setResults(r => ({ ...r, [path]: { status: 'loading' } }));
    try {
      const res = await fetch(path, { headers: { ...dashboardApiAuthHeaders() } });
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* keep raw */ }
      setResults(r => ({ ...r, [path]: { status: res.ok ? 'ok' : 'error', code: res.status, response: pretty } }));
      setExpanded(e => ({ ...e, [path]: true }));
    } catch (e) {
      setResults(r => ({ ...r, [path]: { status: 'error', response: String(e) } }));
      setExpanded(e => ({ ...e, [path]: true }));
    }
  };

  const panel: React.CSSProperties = {
    background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px',
  };

  const methodBadge = (method: 'GET' | 'POST'): React.CSSProperties => ({
    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
    fontFamily: 'var(--font-mono)',
    background: method === 'GET' ? 'rgba(96,165,250,0.15)' : 'rgba(167,139,250,0.15)',
    color: method === 'GET' ? 'var(--accent-blue)' : 'var(--accent-purple)',
    flexShrink: 0,
  });

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'var(--font-ui)' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 600, margin: 0 }}>Tools & API</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>Live API-Test · Klick auf Run zum Testen</p>
      </div>

      {/* External Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 32 }}>
        {EXTERNAL_LINKS.map(link => (
          <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
            style={{ ...panel, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'border-color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{link.label}</p>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{link.desc}</p>
            </div>
            <ExternalLink size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          </a>
        ))}
      </div>

      {/* API Routes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {API_CATEGORIES.map(cat => (
          <div key={cat.category} style={panel}>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              {cat.category}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cat.routes.map((route) => {
                const state = results[route.path] ?? { status: 'idle' };
                const isExpanded = expanded[route.path];
                return (
                  <div key={route.path} style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--layer-2)' }}>
                      <span style={methodBadge(route.method)}>{route.method}</span>
                      <span style={{ color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-mono)', flex: 1 }}>{route.path}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: 12, marginRight: 8 }}>{route.description}</span>
                      {state.code && (
                        <span style={{
                          fontSize: 10, padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--font-mono)',
                          background: state.status === 'ok' ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                          color: state.status === 'ok' ? 'var(--accent-green)' : 'var(--accent-red)',
                        }}>{state.code}</span>
                      )}
                      {state.response && (
                        <button onClick={() => setExpanded(e => ({ ...e, [route.path]: !isExpanded }))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                      )}
                      <button
                        onClick={() => run(route.path)}
                        disabled={state.status === 'loading'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '4px 10px', borderRadius: 6, cursor: state.status === 'loading' ? 'not-allowed' : 'pointer',
                          background: state.status === 'ok' ? 'rgba(52,211,153,0.12)' : 'rgba(56,189,248,0.1)',
                          border: `1px solid ${state.status === 'ok' ? 'rgba(52,211,153,0.3)' : 'rgba(56,189,248,0.2)'}`,
                          color: state.status === 'ok' ? 'var(--accent-green)' : 'var(--accent-blue)',
                          fontSize: 11, fontWeight: 600, transition: 'all 0.12s',
                        }}
                      >
                        {state.status === 'loading'
                          ? <><Loader2 size={11} style={{ animation: 'spin 0.8s linear infinite' }} /> Running</>
                          : state.status === 'ok'
                            ? <><CheckCircle size={11} /> Done</>
                            : <><Play size={11} /> Run</>}
                      </button>
                    </div>
                    {isExpanded && state.response && (
                      <pre style={{
                        margin: 0, padding: '12px 14px',
                        background: 'var(--layer-3)', borderTop: '1px solid var(--border)',
                        fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)',
                        overflowX: 'auto', maxHeight: 300, whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                      }}>{state.response.length > 3000 ? state.response.slice(0, 3000) + '\n…' : state.response}</pre>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
