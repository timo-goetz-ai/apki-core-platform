'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ActivityFeedWidget } from '@/components/ActivityFeedWidget';
import {
  Server, Activity, Bot, Database, Shield,
  Cpu, BarChart2, Terminal, Network, Mic, Home, Mail,
  RefreshCw, Workflow, Layers, Boxes,
} from 'lucide-react';

const stagger = { visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

type ServiceStatus = 'online' | 'degraded' | 'offline' | 'unknown';
interface ServiceHealth { status: ServiceStatus; latency?: number; }

const CORE_SERVICES = [
  { id: 'nexus-core',  name: 'Nexus API',   role: 'FastAPI',    url: 'https://api.automation-plus-ki.de',       icon: <Server size={13} /> },
  { id: 'n8n',         name: 'n8n',         role: 'Automation', url: 'https://n8n.automation-plus-ki.de',       icon: <Workflow size={13} /> },
  { id: 'nocodb',      name: 'NocoDB',      role: 'Database',   url: 'https://nocodb.automation-plus-ki.de',    icon: <Database size={13} /> },
  { id: 'grafana',     name: 'Grafana',     role: 'Monitoring', url: 'https://grafana.automation-plus-ki.de',   icon: <BarChart2 size={13} /> },
  { id: 'agents',      name: 'Agents',      role: 'AI Hub',     url: 'https://agents.automation-plus-ki.de',    icon: <Bot size={13} /> },
  { id: 'voice',       name: 'Voice AI',    role: 'TTS',        url: 'https://voice.automation-plus-ki.de',     icon: <Mic size={13} /> },
  { id: 'appflowy',    name: 'AppFlowy',    role: 'Notes',      url: 'https://appflowy.automation-plus-ki.de',  icon: <Terminal size={13} /> },
  { id: 'authentik',   name: 'Authentik',   role: 'SSO',        url: 'https://auth.automation-plus-ki.de',      icon: <Shield size={13} /> },
  { id: 'prometheus',  name: 'Prometheus',  role: 'Metrics',    url: 'https://prometheus.automation-plus-ki.de',icon: <Activity size={13} /> },
  { id: 'qdrant',      name: 'Qdrant',      role: 'Vector DB',  url: 'https://qdrant.automation-plus-ki.de',    icon: <Database size={13} /> },
  { id: 'infra',       name: 'Infra Mon.',  role: 'Status',     url: 'https://infra.automation-plus-ki.de',     icon: <Layers size={13} /> },
  { id: 'homepage',    name: 'Homepage',    role: 'Dashboard',  url: 'https://dashboard.automation-plus-ki.de', icon: <Home size={13} /> },
  { id: 'mailpit',     name: 'Mailpit',     role: 'SMTP',       url: 'https://mail.automation-plus-ki.de',      icon: <Mail size={13} /> },
];

const MCP_SERVICES = [
  { id: 'mcp-grafana',    name: 'MCP Grafana',    url: 'https://mcp-grafana.automation-plus-ki.de' },
  { id: 'mcp-nocodb',     name: 'MCP NocoDB',     url: 'https://mcp-nocodb.automation-plus-ki.de' },
  { id: 'mcp-postgres',   name: 'MCP Postgres',   url: 'https://mcp-postgres.automation-plus-ki.de' },
  { id: 'mcp-prometheus', name: 'MCP Prometheus', url: 'https://mcp-prometheus.automation-plus-ki.de' },
  { id: 'mcp-qdrant',     name: 'MCP Qdrant',     url: 'https://mcp-qdrant.automation-plus-ki.de' },
  { id: 'mcp-filesystem', name: 'MCP Filesystem', url: 'https://mcp-filesystem.automation-plus-ki.de' },
  { id: 'mcp-authentik',  name: 'MCP Authentik',  url: 'https://mcp-authentik.automation-plus-ki.de' },
  { id: 'mcp-n8n',        name: 'MCP n8n',        url: 'https://mcp-n8n.automation-plus-ki.de' },
  { id: 'mcp-github',     name: 'MCP GitHub',     url: 'https://mcp-github.automation-plus-ki.de' },
  { id: 'mcp-cloudflare', name: 'MCP Cloudflare', url: 'https://mcp-cloudflare.automation-plus-ki.de' },
  { id: 'mcp-google',     name: 'MCP Google',     url: 'https://mcp-google.automation-plus-ki.de' },
  { id: 'mcp-hetzner',    name: 'MCP Hetzner',    url: 'https://mcp-hetzner.automation-plus-ki.de' },
  { id: 'mcp-coolify',    name: 'MCP Coolify',    url: 'https://mcp-coolify.automation-plus-ki.de' },
];

const STATUS_CFG = {
  online:   { color: '#4ade80', label: 'online'   },
  degraded: { color: '#fbbf24', label: 'degraded' },
  offline:  { color: '#f87171', label: 'offline'  },
  unknown:  { color: '#64748b', label: '…'        },
};

export default function CockpitPage() {
  const [apiHealth, setApiHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const [serviceHealth, setServiceHealth] = useState<Record<string, ServiceHealth>>({});
  const [lastChecked, setLastChecked] = useState('');
  const [checking, setChecking] = useState(false);
  const [time, setTime] = useState('');

  const fetchHealth = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/services', { cache: 'no-store' });
      const data = await res.json();
      setServiceHealth(data);
      setLastChecked(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch { /* ignore */ }
    finally { setChecking(false); }
  }, []);

  useEffect(() => {
    fetch('https://api.automation-plus-ki.de/health').then(r => r.json()).then(setApiHealth).catch(() => {});
    fetchHealth();
    const iv = setInterval(fetchHealth, 60_000);
    const tick = () => setTime(new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    tick();
    const clockIv = setInterval(tick, 1000);
    return () => { clearInterval(iv); clearInterval(clockIv); };
  }, [fetchHealth]);

  const getStatus = (id: string): ServiceStatus => (serviceHealth[id]?.status as ServiceStatus) ?? 'unknown';
  const getLatency = (id: string) => serviceHealth[id]?.latency ? `${serviceHealth[id].latency}ms` : undefined;
  const allServices = [...CORE_SERVICES, ...MCP_SERVICES];
  const onlineCount = Object.values(serviceHealth).filter(s => s.status === 'online').length;
  const totalChecked = Object.keys(serviceHealth).length;

  const renderServiceCard = (svc: { id: string; name: string; role?: string; url?: string; icon?: React.ReactNode }) => {
    const st = getStatus(svc.id);
    const sc = STATUS_CFG[st];
    const lat = getLatency(svc.id);
    return (
      <div key={svc.id} className="flex flex-col gap-1.5 p-2.5 rounded-lg bg-slate-800/70 border border-slate-700/50 hover:border-slate-600/50 transition-colors">
        <div className="flex justify-between items-center">
          <span className="text-slate-500">{svc.icon ?? <Cpu size={13} />}</span>
          <span className="flex items-center gap-1 text-[10px]">
            <span style={{
              width: 5, height: 5, borderRadius: '50%', background: sc.color, flexShrink: 0,
              animation: st === 'online' ? 'live-pulse 2s ease-in-out infinite' : 'none',
              display: 'inline-block',
            }} />
            <span style={{ color: sc.color }}>{sc.label}</span>
          </span>
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-200 m-0 leading-tight">{svc.name}</p>
          <p className="text-[10px] text-slate-500 mt-0.5 m-0">
            {lat ?? (svc.role ?? 'MCP')}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <motion.section initial="hidden" animate="visible" variants={stagger} className="mb-6">
        {/* Status badge */}
        <motion.div variants={fadeUp} className="mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" style={{ animation: 'live-pulse 2s infinite' }} />
            production · hetzner cpx42 · nürnberg · 46.224.145.109
          </span>
        </motion.div>

        <motion.h1 variants={fadeUp} className="text-2xl font-bold tracking-tight mb-1.5">
          Automation + KI
          <span className="text-slate-500 font-normal"> · OS Control Center</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="text-sm text-slate-400 mb-5 max-w-lg leading-relaxed">
          KI-Agents · Automatisierung · Infrastruktur · Content · Monitoring — alles an einem Ort.
        </motion.p>

        {/* KPI Cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Services',      value: totalChecked ? `${onlineCount}/${totalChecked}` : '—', sub: 'online · health live',    icon: <Server size={14} />,   positive: onlineCount > 0 },
            { label: 'Container',     value: '63',                                                    sub: 'docker · hetzner',        icon: <Boxes size={14} />,    positive: true },
            { label: 'n8n Workflows', value: '17',                                                    sub: '16 aktiv · 1 pausiert',   icon: <Workflow size={14} />, positive: true },
            { label: 'MCP Server',    value: '19',                                                    sub: 'alle verbunden',          icon: <Cpu size={14} />,      positive: true },
            { label: 'NocoDB',        value: '23',                                                    sub: 'Tabellen · 4 Bases',      icon: <Database size={14} />, positive: true },
            { label: 'API Status',    value: apiHealth ? 'Healthy' : '—',                             sub: 'api.automation-plus-ki.de', icon: <Activity size={14} />, positive: !!apiHealth },
          ].map(kpi => (
            <div key={kpi.label} className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3.5">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider m-0">{kpi.label}</p>
                <span className={kpi.positive ? 'text-emerald-400 opacity-70' : 'text-slate-500'}>{kpi.icon}</span>
              </div>
              <p className={`text-xl font-bold tracking-tight mb-0.5 ${kpi.positive ? 'text-slate-100' : 'text-amber-400'}`}>
                {kpi.value}
              </p>
              <p className="text-[10px] text-slate-500 m-0">{kpi.sub}</p>
            </div>
          ))}
        </motion.div>
      </motion.section>

      {/* System Health */}
      <motion.section
        initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-20px' }} variants={stagger}
        className="mb-5"
      >
        <motion.div variants={fadeUp} className="mb-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider m-0">
            System Health <span className="font-normal normal-case tracking-normal">— alle Services im Blick</span>
          </p>
        </motion.div>

        <motion.div variants={fadeUp} className="grid gap-3" style={{ gridTemplateColumns: '1fr 280px' }}>
          {/* Service Health Grid */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-100 m-0">Platform Services</p>
                <p className="text-[11px] text-slate-400 mt-0.5 m-0">automation-plus-ki.de · {allServices.length} Services</p>
              </div>
              <button
                onClick={fetchHealth}
                disabled={checking}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw size={10} style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }} />
                {checking ? 'Prüfe…' : 'Refresh'}
              </button>
            </div>

            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Core</p>
            <div className="grid gap-1.5 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
              {CORE_SERVICES.map(renderServiceCard)}
            </div>

            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">MCP Server · 19 aktiv</p>
            <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))' }}>
              {MCP_SERVICES.map(renderServiceCard)}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
            <ActivityFeedWidget />
          </div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
        className="pt-4 border-t border-slate-800 flex justify-between flex-wrap gap-2 mt-4"
      >
        <p className="text-[11px] text-slate-600 m-0">
          Timo Götz · DEKRA-zertifizierter KI-Manager · automation-plus-ki.de
        </p>
        <p className="text-[11px] text-slate-600 m-0 font-mono">
          {lastChecked ? `Geprüft: ${lastChecked}` : 'Verbinde…'}
        </p>
      </motion.footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes live-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
