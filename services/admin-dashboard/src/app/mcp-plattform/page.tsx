'use client';

import { useEffect, useState } from 'react';
import {
  Server, ExternalLink, RefreshCw, Activity,
  GitBranch, Database, Zap, Shield, Cloud, BarChart2,
  Globe, Box, CheckCircle2, XCircle, AlertTriangle,
  Copy, Check,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ServiceStatus { status: 'online' | 'degraded' | 'offline' | 'unknown'; latency?: string; }

// ── Config ─────────────────────────────────────────────────────────────────────
const MCP_SERVERS = [
  { id: 'nocodb',     label: 'NocoDB',      desc: 'Datenbank-Backend',       icon: <Database size={14} />,  color: '#fb923c', url: 'https://nocodb.automation-plus-ki.de' },
  { id: 'n8n',        label: 'n8n',         desc: 'Workflow Automation',      icon: <Zap size={14} />,       color: '#60a5fa', url: 'https://n8n.automation-plus-ki.de' },
  { id: 'grafana',    label: 'Grafana',     desc: 'Monitoring & Alerts',      icon: <BarChart2 size={14} />, color: '#f97316', url: 'https://grafana.automation-plus-ki.de' },
  { id: 'prometheus', label: 'Prometheus',  desc: 'Metriken & Alerting',      icon: <Activity size={14} />, color: '#a78bfa', url: 'https://prometheus.automation-plus-ki.de' },
  { id: 'coolify',    label: 'Coolify',     desc: 'Deployment-Plattform',     icon: <Cloud size={14} />,    color: '#38bdf8', url: 'https://coolify.automation-plus-ki.de' },
  { id: 'authentik',  label: 'Authentik',   desc: 'SSO & Identity Provider',  icon: <Shield size={14} />,   color: '#34d399', url: 'https://auth.automation-plus-ki.de' },
  { id: 'qdrant',     label: 'Qdrant',      desc: 'Vektor-Datenbank',         icon: <Box size={14} />,      color: '#fbbf24', url: 'https://qdrant.automation-plus-ki.de' },
  { id: 'redis',      label: 'Redis',       desc: 'In-Memory Cache',          icon: <Database size={14} />, color: '#f87171', url: null },
  { id: 'postgres',   label: 'PostgreSQL',  desc: 'Relationale Datenbank',    icon: <Database size={14} />, color: '#60a5fa', url: null },
  { id: 'traefik',    label: 'Traefik',     desc: 'Reverse Proxy & Routing',  icon: <Globe size={14} />,    color: '#34d399', url: null },
  { id: 'github',     label: 'GitHub',      desc: 'Code & Versionierung',     icon: <GitBranch size={14} />,color: '#94a3b8', url: 'https://github.com/TimoGoetz1988/aios' },
  { id: 'cloudflare', label: 'Cloudflare',  desc: 'DNS & CDN',                icon: <Globe size={14} />,    color: '#fbbf24', url: 'https://dash.cloudflare.com' },
];

const INFRA = [
  { label: 'Coolify',    sub: 'Deployments',      url: 'https://coolify.automation-plus-ki.de',    color: '#38bdf8' },
  { label: 'Grafana',    sub: 'Monitoring',        url: 'https://grafana.automation-plus-ki.de',    color: '#f97316' },
  { label: 'Authentik',  sub: 'SSO & Identity',    url: 'https://auth.automation-plus-ki.de',       color: '#34d399' },
  { label: 'Prometheus', sub: 'Metriken',          url: 'https://prometheus.automation-plus-ki.de', color: '#a78bfa' },
  { label: 'NocoDB',     sub: 'No-Code DB',        url: 'https://nocodb.automation-plus-ki.de',     color: '#fb923c' },
  { label: 'n8n',        sub: 'Automations',       url: 'https://n8n.automation-plus-ki.de',        color: '#60a5fa' },
];

const ENDPOINTS = [
  { label: 'n8n API',         url: 'http://10.0.1.29:5678',                   auth: 'X-N8N-API-KEY' },
  { label: 'NocoDB API',      url: 'https://nocodb.automation-plus-ki.de',    auth: 'xc-token' },
  { label: 'Prometheus',      url: 'http://10.0.1.29:9090',                   auth: 'intern' },
  { label: 'Admin Dashboard', url: 'https://admin.automation-plus-ki.de',     auth: 'Authentik OIDC' },
  { label: 'Grafana',         url: 'https://grafana.automation-plus-ki.de',   auth: 'Service Token' },
  { label: 'Coolify',         url: 'https://coolify.automation-plus-ki.de',   auth: 'Bearer' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function StatusDot({ s }: { s: ServiceStatus | undefined }) {
  const c = !s ? '#475569' : s.status === 'online' ? '#34d399' : s.status === 'degraded' ? '#fbbf24' : s.status === 'offline' ? '#f87171' : '#475569';
  const pulse = s?.status === 'online';
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: c, flexShrink: 0,
      boxShadow: pulse ? `0 0 5px ${c}80` : 'none',
    }} />
  );
}

function StatusIcon({ s }: { s: ServiceStatus | undefined }) {
  if (!s || s.status === 'unknown') return <span style={{ color: '#475569', fontSize: 10, fontFamily: 'var(--font-mono)' }}>—</span>;
  if (s.status === 'online') return <CheckCircle2 size={11} style={{ color: '#34d399' }} />;
  if (s.status === 'degraded') return <AlertTriangle size={11} style={{ color: '#fbbf24' }} />;
  return <XCircle size={11} style={{ color: '#f87171' }} />;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#34d399' : 'var(--text-muted)', display: 'flex', padding: 2 }}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function MCPPlattformPage() {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    try {
      const data = await fetch('/api/services').then(r => r.json());
      setStatuses(data ?? {});
    } catch { /* silent */ }
    setLoading(false);
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => { load(); }, []);

  const online  = MCP_SERVERS.filter(s => statuses[s.id]?.status === 'online').length;
  const degraded = MCP_SERVERS.filter(s => statuses[s.id]?.status === 'degraded').length;
  const offline = MCP_SERVERS.filter(s => statuses[s.id]?.status === 'offline').length;

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
          }}>
            <Server size={18} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>MCP Plattform</h1>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {MCP_SERVERS.length} Server · Hetzner 46.224.145.109 · Coolify
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 8, cursor: 'pointer',
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', fontSize: 12,
          }}>
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            Refresh
          </button>
          <a
            href="https://coolify.automation-plus-ki.de"
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              borderRadius: 8, textDecoration: 'none',
              background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.2)',
              color: '#38bdf8', fontSize: 12, fontWeight: 600,
            }}
          >
            Coolify <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Online',    value: loading ? '…' : String(online),    color: '#34d399', icon: <CheckCircle2 size={13} /> },
          { label: 'Degraded',  value: loading ? '…' : String(degraded), color: '#fbbf24', icon: <AlertTriangle size={13} /> },
          { label: 'Offline',   value: loading ? '…' : String(offline),  color: '#f87171', icon: <XCircle size={13} /> },
          { label: 'Gesamt',    value: String(MCP_SERVERS.length),        color: '#60a5fa', icon: <Server size={13} /> },
        ].map(k => (
          <div key={k.label} style={{
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ color: k.color }}>{k.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: k.color, lineHeight: 1 }}>{k.value}</p>
              <p style={{ margin: '3px 0 0', fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── MCP Server Grid ── */}
      <section style={{ marginBottom: 20 }}>
        <p style={{ margin: '0 0 10px', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          MCP Server — {MCP_SERVERS.length} konfiguriert
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
          {MCP_SERVERS.map(mcp => {
            const st = statuses[mcp.id];
            const isOnline = st?.status === 'online';
            return (
              <div
                key={mcp.id}
                style={{
                  background: 'var(--layer-2)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: '12px 14px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                  transition: 'border-color 0.12s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = mcp.color + '44'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: mcp.color }}>{mcp.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{mcp.label}</span>
                  </div>
                  <StatusDot s={st} />
                </div>
                <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)' }}>{mcp.desc}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <StatusIcon s={st} />
                    {st?.latency && (
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{st.latency}</span>
                    )}
                    {!st && !loading && (
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>ext.</span>
                    )}
                  </div>
                  {mcp.url ? (
                    <a
                      href={mcp.url} target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none',
                        padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 500,
                        background: `${mcp.color}12`, color: mcp.color,
                        border: `1px solid ${mcp.color}30`,
                      }}
                    >
                      UI <ExternalLink size={9} />
                    </a>
                  ) : (
                    <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>intern</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Bottom 2-col: Infra-Links + API-Endpoints ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Schnellzugriff */}
        <section>
          <p style={{ margin: '0 0 10px', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Infrastruktur — Schnellzugriff
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {INFRA.map(link => (
              <a
                key={link.url}
                href={link.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: 9, textDecoration: 'none',
                  background: 'var(--layer-2)', border: '1px solid var(--border)',
                  transition: 'border-color 0.1s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = link.color + '44'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'; }}
              >
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{link.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{link.sub}</span>
                </div>
                <ExternalLink size={10} style={{ color: 'var(--text-muted)' }} />
              </a>
            ))}
          </div>
        </section>

        {/* API-Adressen */}
        <section>
          <p style={{ margin: '0 0 10px', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            API-Adressen
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ENDPOINTS.map(ep => (
              <div
                key={ep.url}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
                  background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 9,
                }}
              >
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)' }}>{ep.label}</span>
                  <span style={{ display: 'block', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ep.url}</span>
                </div>
                <span style={{
                  fontSize: 8, fontFamily: 'var(--font-mono)', color: '#60a5fa',
                  background: 'rgba(96,165,250,0.1)', padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                }}>{ep.auth}</span>
                <CopyBtn text={ep.url} />
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ── Server Info ── */}
      <section style={{ marginTop: 16 }}>
        <p style={{ margin: '0 0 10px', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Server-Konfiguration
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { label: 'Host',       value: 'Hetzner VPS',         sub: '46.224.145.109' },
            { label: 'Proxy',      value: 'Traefik v3',          sub: 'via Coolify' },
            { label: 'Auth',       value: 'Authentik OIDC',      sub: 'SSO / Forward Auth' },
            { label: 'Registry',   value: 'ghcr.io',             sub: 'TimoGoetz1988' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              borderRadius: 9, padding: '10px 14px',
            }}>
              <p style={{ margin: 0, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</p>
              <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.value}</p>
              <p style={{ margin: '2px 0 0', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
