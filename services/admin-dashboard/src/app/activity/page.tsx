'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Rocket, Globe, Settings2, Server,
  CheckCircle2, Clock,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type ActivityType = 'deploy' | 'dns' | 'config' | 'service';
type ActivityFilter = 'all' | ActivityType;

interface ActivityEntry {
  id: string;
  type: ActivityType;
  time: string;
  title: string;
  desc: string;
  status: 'success' | 'warning' | 'error';
  tags?: string[];
}

// ── Data ──────────────────────────────────────────────────────────────────────
const ACTIVITY: ActivityEntry[] = [
  {
    id: '1',
    type: 'deploy',
    time: '2026-03-17 14:23',
    title: 'Admin Dashboard deployed',
    desc: 'Build #47 · AI Command Center + Model redesign',
    status: 'success',
    tags: ['Build #47', 'Next.js 14'],
  },
  {
    id: '2',
    type: 'config',
    time: '2026-03-17 12:11',
    title: 'NocoDB an PostgreSQL angebunden',
    desc: 'NC_DB konfiguriert · Bucket noco-aios aktiv',
    status: 'success',
    tags: ['PostgreSQL', 'S3'],
  },
  {
    id: '3',
    type: 'deploy',
    time: '2026-03-16 21:08',
    title: 'NocoDB nach Coolify migriert',
    desc: 'Standalone Service · S3-Storage konfiguriert',
    status: 'success',
    tags: ['Coolify', 'Migration'],
  },
  {
    id: '4',
    type: 'dns',
    time: '2026-03-15 09:45',
    title: 'DNS: admin.automation-plus-ki.de',
    desc: 'Route auf neues Dashboard umgestellt',
    status: 'success',
    tags: ['Cloudflare', 'admin.*'],
  },
  {
    id: '5',
    type: 'deploy',
    time: '2026-03-14 16:30',
    title: 'Ollama Container gestartet',
    desc: 'Lokale LLMs: llama3.2, phi3, qwen2.5',
    status: 'success',
    tags: ['Ollama', 'GPU', 'Hetzner'],
  },
  {
    id: '6',
    type: 'service',
    time: '2026-03-12 11:54',
    title: 'Infra-Dashboard migriert',
    desc: 'ghcr.io/timogoetz1988/aios-admin-dashboard',
    status: 'success',
    tags: ['GHCR', 'Docker'],
  },
  {
    id: '7',
    type: 'config',
    time: '2026-03-11 08:30',
    title: 'Grafana + Prometheus integriert',
    desc: 'Datasources konfiguriert · Dashboards importiert',
    status: 'success',
    tags: ['Grafana', 'Prometheus'],
  },
  {
    id: '8',
    type: 'config',
    time: '2026-03-10 14:15',
    title: 'Multi-Provider LLM Routing konfiguriert',
    desc: 'OpenRouter · Anthropic · Google AI Studio · Ollama',
    status: 'success',
    tags: ['LLM', 'OpenRouter'],
  },
  {
    id: '9',
    type: 'service',
    time: '2026-03-08 10:00',
    title: 'Authentik SSO aktiviert',
    desc: 'n8n + AppFlowy via OAuth2 geschützt',
    status: 'success',
    tags: ['Authentik', 'SSO', 'OAuth2'],
  },
  {
    id: '10',
    type: 'deploy',
    time: '2026-03-05 16:45',
    title: 'Hetzner CPX42 eingerichtet',
    desc: 'Server 46.224.145.109 · Coolify installiert',
    status: 'success',
    tags: ['Hetzner', 'CPX42'],
  },
];

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: 'all',     label: 'Alle'      },
  { key: 'deploy',  label: 'Deploy'    },
  { key: 'dns',     label: 'DNS'       },
  { key: 'config',  label: 'Config'    },
  { key: 'service', label: 'Service'   },
];

const TYPE_CONFIG: Record<ActivityType, { icon: React.ReactNode; color: string; label: string }> = {
  deploy:  { icon: <Rocket size={13} />,   color: '#38bdf8', label: 'Deploy'  },
  dns:     { icon: <Globe size={13} />,    color: '#34d399', label: 'DNS'     },
  config:  { icon: <Settings2 size={13} />,color: '#fbbf24', label: 'Config'  },
  service: { icon: <Server size={13} />,   color: '#a78bfa', label: 'Service' },
};

const STATUS_CONFIG = {
  success: { color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)',  label: 'Erfolg'  },
  warning: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)',  border: 'rgba(251,191,36,0.2)',  label: 'Warnung' },
  error:   { color: '#f87171', bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.2)', label: 'Fehler'  },
};

function formatRelativeTime(timeStr: string): string {
  const date = new Date(timeStr);
  const now = new Date('2026-03-17T15:00:00');
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return 'Gerade eben';
  if (diffHours < 24) return `vor ${diffHours}h`;
  if (diffDays === 1) return 'Gestern';
  return `vor ${diffDays} Tagen`;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } };

export default function ActivityPage() {
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const filtered = filter === 'all'
    ? ACTIVITY
    : ACTIVITY.filter(e => e.type === filter);

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
            background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(167,139,250,0.15))',
            border: '1px solid rgba(52,211,153,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Activity size={17} style={{ color: '#34d399' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              Aktivität
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: '#475569', fontFamily: 'var(--font-mono)' }}>
              System-Changelog · {ACTIVITY.length} Einträge
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
          const count = ACTIVITY.filter(e => e.type === type).length;
          return (
            <div key={type} style={{
              flex: 1, background: 'rgba(22,27,34,0.8)', border: '1px solid rgba(148,163,184,0.08)',
              borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
              transition: 'border-color 0.12s',
            }}
            onClick={() => setFilter(type as ActivityType)}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(148,163,184,0.18)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(148,163,184,0.08)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, color: cfg.color }}>
                {cfg.icon}
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cfg.label}</span>
              </div>
              <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#f1f5f9' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
        {FILTERS.map(f => {
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
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
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div style={{ maxWidth: 720 }}>
        <motion.div
          key={filter}
          variants={container}
          initial="hidden"
          animate="show"
          style={{ position: 'relative' }}
        >
          {/* Vertical line */}
          <div style={{
            position: 'absolute', left: 17, top: 0, bottom: 0, width: 1,
            background: 'linear-gradient(180deg, rgba(56,189,248,0.2) 0%, rgba(148,163,184,0.06) 60%, transparent 100%)',
          }} />

          {filtered.map((entry, idx) => {
            const typeCfg = TYPE_CONFIG[entry.type];
            const statusCfg = STATUS_CONFIG[entry.status];
            const isLast = idx === filtered.length - 1;

            return (
              <motion.div
                key={entry.id}
                variants={item}
                style={{
                  display: 'flex', gap: 16,
                  paddingBottom: isLast ? 0 : 20,
                  position: 'relative',
                }}
              >
                {/* Icon node */}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: `${typeCfg.color}18`,
                  border: `1px solid ${typeCfg.color}35`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: typeCfg.color, zIndex: 1, marginTop: 2,
                }}>
                  {typeCfg.icon}
                </div>

                {/* Content card */}
                <div style={{
                  flex: 1, background: 'rgba(22,27,34,0.75)',
                  border: '1px solid rgba(148,163,184,0.08)',
                  borderRadius: 10, padding: '14px 16px',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(148,163,184,0.16)'}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(148,163,184,0.08)'}
                >
                  {/* Card header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>
                        {entry.title}
                      </p>
                      <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>{entry.desc}</p>
                    </div>
                    {/* Status badge */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 9px', borderRadius: 999, flexShrink: 0, marginLeft: 12,
                      background: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
                      fontSize: 10, fontWeight: 600, color: statusCfg.color,
                      fontFamily: 'var(--font-mono)',
                    }}>
                      <CheckCircle2 size={9} />
                      {statusCfg.label}
                    </span>
                  </div>

                  {/* Footer: time + tags */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, fontFamily: 'var(--font-mono)', color: '#475569' }}>
                      <Clock size={9} />
                      {formatRelativeTime(entry.time)}
                      <span style={{ opacity: 0.5 }}>·</span>
                      {entry.time}
                    </span>
                    {entry.tags?.map(tag => (
                      <span key={tag} style={{
                        padding: '1px 7px', borderRadius: 4,
                        background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)',
                        fontSize: 10, color: '#475569', fontFamily: 'var(--font-mono)',
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          Keine Aktivitäten in dieser Kategorie.
        </div>
      )}
    </motion.div>
  );
}
