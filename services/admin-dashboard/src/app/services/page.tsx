'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ExternalLink, Server, Cpu, Workflow, Database,
  BarChart2, ShieldCheck, BookOpen, Rocket, Bot,
  Activity,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type ServiceStatus = 'online' | 'degraded' | 'offline';
type Category = 'all' | 'core' | 'ai' | 'automation' | 'data' | 'monitoring' | 'security' | 'infra';

interface Service {
  name: string;
  desc: string;
  url: string;
  status: ServiceStatus;
  latency: number;
  category: Exclude<Category, 'all'>;
  note?: string;
  internal?: boolean;
}

// ── Data ──────────────────────────────────────────────────────────────────────
const SERVICES: Service[] = [
  { name: 'Admin Dashboard',  desc: 'Zentrale Steuereinheit',         url: 'admin.automation-plus-ki.de',         status: 'online', latency: 12,  category: 'core' },
  { name: 'Nexus-Core API',   desc: 'REST + WebSocket Backend',       url: 'api.automation-plus-ki.de',           status: 'online', latency: 45,  category: 'core' },
  { name: 'n8n Workflows',    desc: 'Automation Engine',              url: 'n8n.automation-plus-ki.de',           status: 'online', latency: 89,  category: 'automation', note: 'SSO via Authentik' },
  { name: 'NocoDB',           desc: 'Datenbank-Interface',            url: 'nocodb.automation-plus-ki.de',        status: 'online', latency: 34,  category: 'data' },
  { name: 'Grafana',          desc: 'Monitoring & Dashboards',        url: 'grafana.automation-plus-ki.de',       status: 'online', latency: 28,  category: 'monitoring' },
  { name: 'Prometheus',       desc: 'Metriken & Alerting',            url: 'prometheus.automation-plus-ki.de',    status: 'online', latency: 15,  category: 'monitoring' },
  { name: 'Authentik SSO',    desc: 'Identity & Access Management',   url: 'auth.automation-plus-ki.de',          status: 'online', latency: 22,  category: 'security' },
  { name: 'Coolify',          desc: 'Deployment & Infrastructure',    url: 'coolify.automation-plus-ki.de:8000',  status: 'online', latency: 19,  category: 'infra' },
  { name: 'PostgreSQL',       desc: 'Primäre Datenbank',              url: 'homestack-postgres:5432',             status: 'online', latency: 4,   category: 'data', internal: true },
  { name: 'Qdrant',           desc: 'Vektor-Datenbank',               url: 'qdrant:6333',                        status: 'online', latency: 6,   category: 'ai', internal: true },
  { name: 'Playwright Browser', desc: 'Browser Automation Service',   url: 'homestack-playwright-proxy:8080',    status: 'online', latency: 38,  category: 'automation', internal: true },
  { name: 'FishAudio Voice API', desc: 'Voice Synthesis (external)',  url: 'api.fish.audio',                     status: 'online', latency: 120, category: 'ai' },
];

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'all',          label: 'Alle'           },
  { key: 'core',         label: 'Core'           },
  { key: 'ai',           label: 'AI'             },
  { key: 'automation',   label: 'Automation'     },
  { key: 'data',         label: 'Daten'          },
  { key: 'monitoring',   label: 'Monitoring'     },
  { key: 'security',     label: 'Security'       },
  { key: 'infra',        label: 'Infra'          },
];

const CATEGORY_ICONS: Record<Exclude<Category, 'all'>, React.ReactNode> = {
  core:         <Server size={16} />,
  ai:           <Bot size={16} />,
  automation:   <Workflow size={16} />,
  data:         <Database size={16} />,
  monitoring:   <BarChart2 size={16} />,
  security:     <ShieldCheck size={16} />,
  infra:        <Rocket size={16} />,
};

const CATEGORY_COLORS: Record<Exclude<Category, 'all'>, string> = {
  core:         '#38bdf8',
  ai:           '#a78bfa',
  automation:   '#fbbf24',
  data:         '#34d399',
  monitoring:   '#f472b6',
  security:     '#f87171',
  infra:        '#fb923c',
};

function getLatencyColor(ms: number): string {
  if (ms < 20)  return '#34d399';
  if (ms < 100) return '#fbbf24';
  return '#f87171';
}

function StatusBadge({ status }: { status: ServiceStatus }) {
  const cfg = {
    online:   { bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)',  color: '#34d399', label: 'Online'   },
    degraded: { bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)',  color: '#fbbf24', label: 'Degraded' },
    offline:  { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', color: '#f87171', label: 'Offline'  },
  }[status];

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 999,
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      color: cfg.color, fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: '50%', background: cfg.color,
        animation: status === 'online' ? 'status-pulse 2.5s ease-in-out infinite' : 'none',
      }} />
      {cfg.label}
    </span>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  const filtered = activeCategory === 'all'
    ? SERVICES
    : SERVICES.filter(s => s.category === activeCategory);

  const onlineCount = SERVICES.filter(s => s.status === 'online').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '28px 28px 48px', position: 'relative', zIndex: 1 }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(52,211,153,0.15))',
            border: '1px solid rgba(56,189,248,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Server size={17} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              Service Catalog
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: '#475569', fontFamily: 'var(--font-mono)' }}>
              automation-plus-ki.de · {onlineCount}/{SERVICES.length} online
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { label: 'Online',   value: onlineCount,                                               color: '#34d399' },
          { label: 'Services', value: SERVICES.length,                                           color: '#38bdf8' },
          { label: 'Intern',   value: SERVICES.filter(s => s.internal).length,                   color: '#a78bfa' },
          { label: 'Uptime',   value: '99.8%',                                                   color: '#34d399' },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(148,163,184,0.08)',
            borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</span>
            <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: stat.color }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Category filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              style={{
                padding: '5px 14px', borderRadius: 999, cursor: 'pointer',
                border: isActive ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(148,163,184,0.1)',
                background: isActive ? 'rgba(56,189,248,0.1)' : 'rgba(22,27,34,0.6)',
                color: isActive ? '#38bdf8' : '#94a3b8',
                fontSize: 12, fontWeight: isActive ? 600 : 400,
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (!isActive) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(148,163,184,0.2)'; el.style.color = '#f1f5f9'; } }}
              onMouseLeave={e => { if (!isActive) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(148,163,184,0.1)'; el.style.color = '#94a3b8'; } }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Service grid */}
      <motion.div
        key={activeCategory}
        variants={container}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}
      >
        {filtered.map(svc => {
          const catColor = CATEGORY_COLORS[svc.category];
          const catIcon = CATEGORY_ICONS[svc.category];
          return (
            <motion.div
              key={svc.name}
              variants={item}
              style={{
                background: 'rgba(22,27,34,0.85)',
                border: '1px solid rgba(148,163,184,0.08)',
                borderRadius: 12, padding: '18px 20px',
                position: 'relative', overflow: 'hidden',
                cursor: 'default',
                transition: 'border-color 0.15s',
              }}
              whileHover={{ borderColor: 'rgba(148,163,184,0.18)' }}
            >
              {/* Top accent */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${catColor}40, transparent)` }} />

              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: `${catColor}18`,
                    border: `1px solid ${catColor}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: catColor, flexShrink: 0,
                  }}>
                    {catIcon}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{svc.name}</p>
                    <p style={{ margin: 0, fontSize: 11, color: '#475569' }}>{svc.desc}</p>
                  </div>
                </div>
                <StatusBadge status={svc.status} />
              </div>

              {/* URL row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{
                  flex: 1, fontSize: 11, fontFamily: 'var(--font-mono)',
                  color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {svc.internal ? svc.url : `https://${svc.url}`}
                </span>
                {!svc.internal && (
                  <a
                    href={`https://${svc.url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 26, height: 26, borderRadius: 7,
                      background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)',
                      color: '#38bdf8', flexShrink: 0, transition: 'all 0.12s',
                      textDecoration: 'none',
                    }}
                    onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(56,189,248,0.16)'; el.style.borderColor = 'rgba(56,189,248,0.3)'; }}
                    onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(56,189,248,0.08)'; el.style.borderColor = 'rgba(56,189,248,0.15)'; }}
                  >
                    <ExternalLink size={11} />
                  </a>
                )}
              </div>

              {/* Footer: latency + tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {/* Latency pill */}
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '2px 8px', borderRadius: 999,
                  background: `${getLatencyColor(svc.latency)}15`,
                  border: `1px solid ${getLatencyColor(svc.latency)}25`,
                  fontSize: 10, fontFamily: 'var(--font-mono)', color: getLatencyColor(svc.latency),
                }}>
                  <Activity size={9} />
                  {svc.latency}ms
                </span>
                {/* Category tag */}
                <span style={{
                  padding: '2px 8px', borderRadius: 999,
                  background: `${catColor}10`, border: `1px solid ${catColor}20`,
                  fontSize: 10, color: catColor, fontFamily: 'var(--font-mono)',
                }}>
                  {svc.category}
                </span>
                {/* Note */}
                {svc.note && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 999,
                    background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)',
                    fontSize: 10, color: '#475569',
                  }}>
                    {svc.note}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          Keine Services in dieser Kategorie.
        </div>
      )}
    </motion.div>
  );
}
