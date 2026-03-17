'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Server, Activity, Cpu, TrendingUp, TrendingDown,
  Minus, CheckCircle2, AlertTriangle, XCircle,
  RefreshCw, Zap, ArrowRight,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
type ServiceStatus = 'online' | 'degraded' | 'offline' | 'unknown';

const STATUS_COLOR: Record<ServiceStatus, string> = {
  online:   'var(--accent-green)',
  degraded: 'var(--accent-amber)',
  offline:  'var(--accent-red)',
  unknown:  'var(--text-muted)',
};

const STATUS_LABEL: Record<ServiceStatus, string> = {
  online: 'online', degraded: 'degraded', offline: 'offline', unknown: 'unknown',
};

const STATUS_ICON: Record<ServiceStatus, React.ReactNode> = {
  online:   <CheckCircle2 size={10} />,
  degraded: <AlertTriangle size={10} />,
  offline:  <XCircle size={10} />,
  unknown:  <Minus size={10} />,
};

// ── KPI Card ───────────────────────────────────────────────────────────────
function KPICard({ label, value, unit, trend, icon, accentColor }: {
  label: string; value: string | number; unit?: string;
  trend?: 'up' | 'down' | 'flat'; icon: React.ReactNode; accentColor: string;
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'var(--accent-green)' : trend === 'down' ? 'var(--accent-red)' : 'var(--text-muted)';
  return (
    <div
      style={{
        background: 'var(--layer-2)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '20px 22px', position: 'relative',
        overflow: 'hidden', transition: 'border-color 0.18s, transform 0.18s', cursor: 'default',
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = accentColor; el.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--border)'; el.style.transform = 'translateY(0)'; }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, opacity: 0.6 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ color: accentColor, opacity: 0.65 }}>{icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10 }}>
        <span style={{ fontSize: 34, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</span>
        {unit && <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{unit}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <TrendIcon size={10} style={{ color: trendColor }} />
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>live</span>
      </div>
    </div>
  );
}

// ── Status Dot ─────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: ServiceStatus }) {
  const color = STATUS_COLOR[status];
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
      background: color, flexShrink: 0,
      boxShadow: status === 'online' ? `0 0 7px ${color}` : 'none',
      animation: status === 'online' ? 'status-pulse 2.5s ease-in-out infinite' : 'none',
    }} />
  );
}

// ── Service Card ───────────────────────────────────────────────────────────
function ServiceCard({ name, role, status, latency }: {
  name: string; role: string; status: ServiceStatus; latency?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--layer-2)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 9,
        transition: 'border-color 0.14s, background 0.14s', cursor: 'default',
      }}
      onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--border-bright)'; el.style.background = 'var(--layer-3)'; }}
      onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.borderColor = 'var(--border)'; el.style.background = 'var(--layer-2)'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <StatusDot status={status} />
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, fontFamily: 'var(--font-mono)', color: STATUS_COLOR[status] }}>
          {STATUS_ICON[status]}{STATUS_LABEL[status]}
        </span>
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{name}</p>
        <p style={{ fontSize: 10, margin: '3px 0 0', color: 'var(--text-muted)', fontFamily: latency ? 'var(--font-mono)' : 'var(--font-ui)' }}>{latency ?? role}</p>
      </div>
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 14, display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <h2 style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>{title}</h2>
      {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.7 }}>{sub}</span>}
    </div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────
const SERVICES = [
  { id: 'n8n',        name: 'n8n',        role: 'Workflows'  },
  { id: 'nocodb',     name: 'NocoDB',     role: 'Datenbank'  },
  { id: 'grafana',    name: 'Grafana',    role: 'Monitoring' },
  { id: 'coolify',    name: 'Coolify',    role: 'Deployment' },
  { id: 'authentik',  name: 'Authentik',  role: 'Auth / SSO' },
  { id: 'qdrant',     name: 'Qdrant',     role: 'Vector DB'  },
  { id: 'redis',      name: 'Redis',      role: 'Cache'      },
  { id: 'postgres',   name: 'PostgreSQL', role: 'Database'   },
  { id: 'prometheus', name: 'Prometheus', role: 'Metrics'    },
  { id: 'traefik',    name: 'Traefik',    role: 'Proxy'      },
  { id: 'cloudflare', name: 'Cloudflare', role: 'DNS / CDN'  },
  { id: 'appflowy',   name: 'AppFlowy',   role: 'Workspace'  },
];

const QUICK_ACTIONS = [
  { label: '+ Neuer Workflow',  href: '/workflows',           accent: 'var(--accent-blue)'  },
  { label: '+ Agent erstellen', href: '/agents',              accent: 'var(--accent-green)' },
  { label: 'Datenbanken',       href: '/databases',           accent: 'var(--accent-amber)' },
  { label: 'Grafana öffnen',    href: '/monitoring/grafana',  accent: 'var(--accent-red)'   },
];

// ── Page ───────────────────────────────────────────────────────────────────
export default function CockpitPage() {
  const [statuses, setStatuses] = useState<Record<string, { status: ServiceStatus; latency?: string }>>({});
  const [spinning, setSpinning] = useState(false);

  const fetchStatuses = useCallback(async () => {
    setSpinning(true);
    try {
      const res = await fetch('/api/services');
      if (res.ok) setStatuses(await res.json());
    } catch { /* silent */ }
    setTimeout(() => setSpinning(false), 700);
  }, []);

  useEffect(() => {
    fetchStatuses();
    const t = setInterval(fetchStatuses, 30_000);
    return () => clearInterval(t);
  }, [fetchStatuses]);

  const getStatus  = (id: string): ServiceStatus => statuses[id]?.status  ?? 'unknown';
  const getLatency = (id: string): string | undefined => statuses[id]?.latency;
  const onlineCount = Object.values(statuses).filter(s => s.status === 'online').length;
  const totalCount  = Object.keys(statuses).length || SERVICES.length;

  return (
    <div style={{ padding: '32px 32px 56px', position: 'relative', zIndex: 1, animation: 'fade-up 0.3s ease both' }}>

      {/* Hero */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <Zap size={15} style={{ color: 'var(--accent-blue)' }} />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>system / cockpit</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 style={{
            fontFamily: 'Outfit, var(--font-ui)', fontSize: 44, fontWeight: 700,
            letterSpacing: '-0.03em', lineHeight: 1, margin: 0,
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>COCKPIT</h1>
          <button
            onClick={fetchStatuses}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8,
              cursor: 'pointer', background: 'var(--layer-2)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', fontSize: 11, fontFamily: 'var(--font-mono)', transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-bright)'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'}
          >
            <RefreshCw size={11} style={{ animation: spinning ? 'spin 0.7s linear infinite' : 'none' }} />
            refresh
          </button>
        </div>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)', fontWeight: 300, margin: '8px 0 0' }}>
          KI-Agenten · Workflows · Infrastruktur — alles an einem Ort
        </p>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
        <KPICard label="Services Online" value={onlineCount} unit={`/ ${totalCount}`} trend="flat" icon={<Server size={15} />} accentColor="rgba(52,211,153,0.5)" />
        <KPICard label="Workflows" value="17" unit="aktiv" trend="up" icon={<Activity size={15} />} accentColor="rgba(56,189,248,0.5)" />
        <KPICard label="MCP Server" value="19" unit="laufend" trend="flat" icon={<Cpu size={15} />} accentColor="rgba(251,191,36,0.5)" />
        <KPICard label="Uptime" value="99.8" unit="%" trend="up" icon={<TrendingUp size={15} />} accentColor="rgba(52,211,153,0.5)" />
      </div>

      {/* Core Services */}
      <div style={{ marginBottom: 40 }}>
        <SectionHeader title="Core Services" sub="— live status" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
          {SERVICES.map(svc => (
            <ServiceCard key={svc.id} name={svc.name} role={svc.role} status={getStatus(svc.id)} latency={getLatency(svc.id)} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <SectionHeader title="Quick Actions" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {QUICK_ACTIONS.map(action => (
            <a key={action.href} href={action.href} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '13px 16px', borderRadius: 10, textDecoration: 'none',
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, transition: 'all 0.14s',
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = action.accent; el.style.color = action.accent; el.style.background = 'var(--layer-3)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)'; el.style.background = 'var(--layer-2)'; }}
            >
              {action.label}
              <ArrowRight size={13} style={{ opacity: 0.5 }} />
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
