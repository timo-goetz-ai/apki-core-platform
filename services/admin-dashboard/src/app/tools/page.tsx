'use client';
import { CheckCircle, ExternalLink, FlaskConical, Play } from 'lucide-react';

interface ApiRoute {
  method: 'GET' | 'POST';
  path: string;
  description: string;
}

const API_CATEGORIES: Array<{ category: string; routes: ApiRoute[] }> = [
  {
    category: 'Monitoring',
    routes: [
      { method: 'GET', path: '/api/monitoring/grafana', description: 'Grafana Daten' },
      { method: 'GET', path: '/api/monitoring/prometheus', description: 'Prometheus Targets' },
    ],
  },
  {
    category: 'Storage',
    routes: [
      { method: 'GET', path: '/api/storage/s3', description: 'S3 Storage' },
    ],
  },
  {
    category: 'Services & Docker',
    routes: [
      { method: 'GET', path: '/api/services', description: 'Service Health' },
      { method: 'GET', path: '/api/docker/containers', description: 'Container Liste' },
      { method: 'POST', path: '/api/docker/containers/[id]/[action]', description: 'Container steuern' },
    ],
  },
  {
    category: 'LLM / Chat',
    routes: [
      { method: 'GET', path: '/api/chat', description: 'Modelle abrufen' },
      { method: 'POST', path: '/api/chat', description: 'LLM Chat' },
    ],
  },
  {
    category: 'Coolify',
    routes: [
      { method: 'GET', path: '/api/coolify/services', description: 'Coolify Services' },
      { method: 'POST', path: '/api/coolify/deploy', description: 'Deployment triggern' },
    ],
  },
  {
    category: 'Cloudflare',
    routes: [
      { method: 'GET', path: '/api/cloudflare/zones', description: 'DNS Zones' },
      { method: 'GET', path: '/api/cloudflare/tunnels', description: 'Tunnels' },
    ],
  },
  {
    category: 'Integrationen',
    routes: [
      { method: 'GET', path: '/api/n8n/webhooks', description: 'n8n Webhooks' },
      { method: 'GET', path: '/api/github/stats', description: 'GitHub Stats' },
      { method: 'GET', path: '/api/config-status', description: 'Konfiguration Status' },
    ],
  },
  {
    category: 'NocoDB',
    routes: [
      { method: 'GET', path: '/api/nocodb/agents', description: 'Agents' },
      { method: 'GET', path: '/api/nocodb/workflows', description: 'Workflows' },
    ],
  },
];

const PLAYWRIGHT_SCENARIOS = [
  { name: 'Dashboard lädt', status: 'pass' },
  { name: 'Chat funktioniert', status: 'pass' },
  { name: 'Navigation korrekt', status: 'pass' },
];

export default function ToolsPage() {
  const panel: React.CSSProperties = {
    background: 'var(--layer-1)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px',
  };

  const methodBadge = (method: 'GET' | 'POST'): React.CSSProperties => ({
    fontSize: 10,
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: 4,
    fontFamily: 'var(--font-mono)',
    background: method === 'GET' ? 'rgba(96,165,250,0.15)' : 'rgba(167,139,250,0.15)',
    color: method === 'GET' ? 'var(--accent-blue)' : '#a78bfa',
    flexShrink: 0,
  });

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'var(--font-ui)' }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 600, margin: 0 }}>Tools & Testing</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>API Testing mit Bruno · E2E Tests mit Playwright</p>
      </div>

      {/* ── Section 1: Bruno ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 17, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FlaskConical size={16} style={{ color: 'var(--accent-blue)' }} />
              Bruno · API Testing
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
              Alle API-Endpunkte des Dashboards zum Testen
            </p>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13,
            }}
          >
            <ExternalLink size={13} /> Bruno Collection öffnen
          </a>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {API_CATEGORIES.map(cat => (
            <div key={cat.category} style={panel}>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                {cat.category}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {cat.routes.map((route, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', borderRadius: 8, background: 'var(--layer-2)' }}>
                    <span style={methodBadge(route.method)}>{route.method}</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-mono)', flex: 1 }}>{route.path}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{route.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Section 2: Playwright ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <h2 style={{ color: 'var(--text-primary)', fontSize: 17, fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Play size={16} style={{ color: 'var(--accent-green)' }} />
              Playwright · E2E Tests
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
              Browser-Automatisierung & UI Tests
            </p>
          </div>
          <button
            disabled
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontSize: 13, cursor: 'not-allowed', opacity: 0.6,
            }}
            title="Coming soon"
          >
            <Play size={13} /> Tests ausführen
          </button>
        </div>

        <div style={panel}>
          {/* Status + test endpoint */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, padding: '10px 14px', borderRadius: 8, background: 'var(--layer-2)' }}>
            <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 4, background: 'rgba(52,211,153,0.15)', color: 'var(--accent-green)', fontWeight: 600 }}>
              Konfiguriert
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Test-Endpoint:</span>
            <a
              href="/api/chat"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--accent-blue)', fontSize: 13, fontFamily: 'var(--font-mono)', textDecoration: 'none' }}
            >
              /api/chat ↗
            </a>
          </div>

          {/* Test scenarios */}
          <div style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Test-Szenarien
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PLAYWRIGHT_SCENARIOS.map((scenario, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--layer-2)' }}>
                <CheckCircle size={14} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                <span style={{ color: 'var(--text-primary)', fontSize: 13, flex: 1 }}>{scenario.name}</span>
                <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'rgba(52,211,153,0.12)', color: 'var(--accent-green)' }}>
                  {scenario.status}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, color: 'var(--text-muted)', fontSize: 12, fontStyle: 'italic' }}>
            Automatisierte Ausführung — Coming soon
          </div>
        </div>
      </div>
    </div>
  );
}
