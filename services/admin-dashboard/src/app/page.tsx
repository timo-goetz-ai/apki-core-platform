"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import { GitHubStatsWidget } from "@/components/GitHubStatsWidget";
import { ActivityFeedWidget } from "@/components/ActivityFeedWidget";
import { N8NWidget } from "@/components/N8NWidget";
import { DockerControlWidget } from "@/components/DockerControlWidget";
import { CloudflareWidget } from "@/components/CloudflareWidget";
import { AgentOrchestratorWidget } from "@/components/AgentOrchestratorWidget";
import { CorpChatWidget } from "@/components/CorpChatWidget";
import ContentFactoryWidget from "@/components/ContentFactoryWidget";
import { MCPHealthDashboard } from "@/components/MCPHealthDashboard";
import { CrewLauncher } from "@/components/CrewLauncher";
import { CoolifyWidget } from "@/components/CoolifyWidget";
import {
  Server, Activity, Bot, Database, Shield, ExternalLink,
  Cpu, BarChart2, Terminal, Network, Mic, Home, Mail,
  RefreshCw, Workflow, Layers, Boxes, GitBranch,
} from "lucide-react";

// ── Animation ──────────────────────────────────────────────────────────────
const stagger = { visible: { transition: { staggerChildren: 0.05 } } };
const fadeUp = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
};

// ── Types ──────────────────────────────────────────────────────────────────
type ServiceStatus = "online" | "degraded" | "offline" | "unknown";
interface ServiceHealth { status: ServiceStatus; latency?: number; }

// ── Services ───────────────────────────────────────────────────────────────
const CORE_SERVICES = [
  { id: "nexus-core",  name: "Nexus API",   role: "FastAPI",    url: "https://api.automation-plus-ki.de",       icon: <Server size={13} /> },
  { id: "n8n",         name: "n8n",         role: "Automation", url: "https://n8n.automation-plus-ki.de",       icon: <Workflow size={13} /> },
  { id: "nocodb",      name: "NocoDB",      role: "Database",   url: "https://nocodb.automation-plus-ki.de",    icon: <Database size={13} /> },
  { id: "grafana",     name: "Grafana",     role: "Monitoring", url: "https://grafana.automation-plus-ki.de",   icon: <BarChart2 size={13} /> },
  { id: "agents",      name: "Agents",      role: "AI Hub",     url: "https://agents.automation-plus-ki.de",    icon: <Bot size={13} /> },
  { id: "voice",       name: "Voice AI",    role: "TTS",        url: "https://voice.automation-plus-ki.de",     icon: <Mic size={13} /> },
  { id: "appflowy",    name: "AppFlowy",    role: "Notes",      url: "https://appflowy.automation-plus-ki.de",  icon: <Terminal size={13} /> },
  { id: "authentik",   name: "Authentik",   role: "SSO",        url: "https://auth.automation-plus-ki.de",      icon: <Shield size={13} /> },
  { id: "prometheus",  name: "Prometheus",  role: "Metrics",    url: "https://prometheus.automation-plus-ki.de",icon: <Activity size={13} /> },
  { id: "qdrant",      name: "Qdrant",      role: "Vector DB",  url: "https://qdrant.automation-plus-ki.de",    icon: <Database size={13} /> },
  { id: "infra",       name: "Infra Mon.",  role: "Status",     url: "https://infra.automation-plus-ki.de",     icon: <Layers size={13} /> },
  { id: "homepage",    name: "Homepage",    role: "Dashboard",  url: "https://dashboard.automation-plus-ki.de", icon: <Home size={13} /> },
  { id: "mailpit",     name: "Mailpit",     role: "SMTP",       url: "https://mail.automation-plus-ki.de",      icon: <Mail size={13} /> },
];

const MCP_SERVICES = [
  { id: "mcp-grafana",    name: "MCP Grafana",    url: "https://mcp-grafana.automation-plus-ki.de" },
  { id: "mcp-nocodb",     name: "MCP NocoDB",     url: "https://mcp-nocodb.automation-plus-ki.de" },
  { id: "mcp-postgres",   name: "MCP Postgres",   url: "https://mcp-postgres.automation-plus-ki.de" },
  { id: "mcp-prometheus", name: "MCP Prometheus", url: "https://mcp-prometheus.automation-plus-ki.de" },
  { id: "mcp-qdrant",     name: "MCP Qdrant",     url: "https://mcp-qdrant.automation-plus-ki.de" },
  { id: "mcp-filesystem", name: "MCP Filesystem", url: "https://mcp-filesystem.automation-plus-ki.de" },
  { id: "mcp-authentik",  name: "MCP Authentik",  url: "https://mcp-authentik.automation-plus-ki.de" },
  { id: "mcp-n8n",        name: "MCP n8n",        url: "https://mcp-n8n.automation-plus-ki.de" },
  { id: "mcp-github",     name: "MCP GitHub",     url: "https://mcp-github.automation-plus-ki.de" },
  { id: "mcp-cloudflare", name: "MCP Cloudflare", url: "https://mcp-cloudflare.automation-plus-ki.de" },
  { id: "mcp-google",     name: "MCP Google",     url: "https://mcp-google.automation-plus-ki.de" },
  { id: "mcp-hetzner",    name: "MCP Hetzner",    url: "https://mcp-hetzner.automation-plus-ki.de" },
  { id: "mcp-coolify",    name: "MCP Coolify",    url: "https://mcp-coolify.automation-plus-ki.de" },
];

const STATUS_CFG = {
  online:   { color: "var(--positive)", label: "online"   },
  degraded: { color: "var(--warn)",     label: "degraded" },
  offline:  { color: "var(--danger)",   label: "offline"  },
  unknown:  { color: "var(--muted)",    label: "…"        },
};

// ── Section Header ─────────────────────────────────────────────────────────
function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 8, marginTop: 4 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        {label}
        {sub && <span style={{ fontWeight: 400, marginLeft: 8, textTransform: "none", letterSpacing: 0 }}>{sub}</span>}
      </p>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const [apiHealth, setApiHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const [serviceHealth, setServiceHealth] = useState<Record<string, ServiceHealth>>({});
  const [lastChecked, setLastChecked] = useState("");
  const [checking, setChecking] = useState(false);
  const [time, setTime] = useState("");

  const fetchHealth = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/services", { cache: "no-store" });
      const data = await res.json();
      setServiceHealth(data);
      setLastChecked(new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch { /* ignore */ }
    finally { setChecking(false); }
  }, []);

  useEffect(() => {
    fetch("https://api.automation-plus-ki.de/health").then(r => r.json()).then(setApiHealth).catch(() => {});
    fetchHealth();
    const iv = setInterval(fetchHealth, 60_000);
    const tick = () => setTime(new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const clockIv = setInterval(tick, 1000);
    return () => { clearInterval(iv); clearInterval(clockIv); };
  }, [fetchHealth]);

  const getStatus = (id: string): ServiceStatus => (serviceHealth[id]?.status as ServiceStatus) ?? "unknown";
  const getLatency = (id: string) => serviceHealth[id]?.latency ? `${serviceHealth[id].latency}ms` : undefined;
  const allServices = [...CORE_SERVICES, ...MCP_SERVICES];
  const onlineCount = Object.values(serviceHealth).filter(s => s.status === "online").length;
  const totalChecked = Object.keys(serviceHealth).length;

  const renderServiceCard = (svc: { id: string; name: string; role?: string; url: string; icon?: React.ReactNode }) => {
    const st = getStatus(svc.id);
    const sc = STATUS_CFG[st];
    const lat = getLatency(svc.id);
    return (
      <a key={svc.id} href={svc.url} target="_blank" rel="noopener noreferrer"
        style={{
          display: "flex", flexDirection: "column", gap: 5, padding: "9px 10px",
          borderRadius: 8, textDecoration: "none",
          background: "var(--surface2)", border: "1px solid var(--border)",
          transition: "border-color 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border2)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)"; }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "var(--muted)" }}>{svc.icon ?? <Cpu size={13} />}</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10 }}>
            <span style={{
              width: 5, height: 5, borderRadius: "50%", background: sc.color, flexShrink: 0,
              animation: st === "online" ? "live-pulse 2s ease-in-out infinite" : "none",
            }} />
            <span style={{ color: sc.color }}>{sc.label}</span>
          </span>
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, margin: 0, color: "var(--text)", lineHeight: 1.3 }}>{svc.name}</p>
          <p style={{ fontSize: 10, color: "var(--text2)", margin: "1px 0 0", fontFamily: lat ? "JetBrains Mono, monospace" : "inherit" }}>
            {lat ?? (svc.role ?? "MCP")}
          </p>
        </div>
      </a>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <TopBar apiStatus={apiHealth?.status} currentTime={time} />

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "68px 20px 64px" }}>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <motion.section initial="hidden" animate="visible" variants={stagger} style={{ marginBottom: 16 }}>

          <motion.div variants={fadeUp} style={{ marginBottom: 8 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px",
              borderRadius: 20, fontSize: 11, fontWeight: 500,
              background: "var(--accent-bg)", color: "var(--accent)",
              border: "1px solid var(--accent-border)",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--positive)", display: "inline-block", animation: "live-pulse 2s infinite" }} />
              production · hetzner cpx42 · nürnberg · 46.224.145.109
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} style={{
            fontSize: "clamp(22px, 2.8vw, 30px)", fontWeight: 700,
            letterSpacing: "-0.022em", lineHeight: 1.25, margin: "0 0 6px",
          }}>
            Automation + KI
            <span style={{ color: "var(--muted)", fontWeight: 400 }}> · OS Control Center</span>
          </motion.h1>

          <motion.p variants={fadeUp} style={{ fontSize: 14, color: "var(--text2)", maxWidth: 500, lineHeight: 1.6, margin: "0 0 16px" }}>
            KI-Agents · Automatisierung · Infrastruktur · Content · Monitoring — alles an einem Ort.
          </motion.p>

          {/* KPI Row */}
          <motion.div variants={fadeUp}
            style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8 }}
            className="aios-kpi-row"
          >
            {[
              { label: "Services",      value: totalChecked ? `${onlineCount}/${totalChecked}` : "—",  sub: "online · health live",    icon: <Server size={14} />, positive: onlineCount > 0 },
              { label: "Container",     value: "63",                                                    sub: "docker · hetzner",        icon: <Boxes size={14} />,    positive: true },
              { label: "n8n Workflows", value: "17",                                                    sub: "16 aktiv · 1 pausiert",   icon: <Workflow size={14} />, positive: true },
              { label: "MCP Server",    value: "19",                                                    sub: "alle verbunden",          icon: <Cpu size={14} />,      positive: true },
              { label: "NocoDB",        value: "23",                                                    sub: "Tabellen · 4 Bases",      icon: <Database size={14} />, positive: true },
              { label: "API Status",    value: apiHealth ? "Healthy" : "—",                             sub: "api.automation-plus-ki.de",icon: <Activity size={14} />, positive: !!apiHealth },
            ].map(kpi => (
              <div key={kpi.label} className="bento-card" style={{ padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>{kpi.label}</p>
                  <span style={{ color: kpi.positive ? "var(--positive)" : "var(--muted)", opacity: 0.7 }}>{kpi.icon}</span>
                </div>
                <p style={{
                  fontSize: 20, fontWeight: 700, margin: "0 0 2px", letterSpacing: "-0.02em",
                  color: kpi.positive ? "var(--text)" : "var(--warn)",
                }}>{kpi.value}</p>
                <p style={{ fontSize: 10, color: "var(--text2)", margin: 0 }}>{kpi.sub}</p>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* ── System Health ─────────────────────────────────────────────────── */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ marginBottom: 14 }}
        >
          <motion.div variants={fadeUp}>
            <SectionHeader label="System Health" sub="— alle Services im Blick" />
          </motion.div>

          <motion.div variants={fadeUp}
            style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 10 }}
            className="aios-grid-r1"
          >
            {/* Service Health Grid */}
            <div className="bento-card" style={{ padding: "16px 18px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>Platform Services</p>
                  <p style={{ fontSize: 11, color: "var(--text2)", margin: "2px 0 0" }}>automation-plus-ki.de · {allServices.length} Services</p>
                </div>
                <button onClick={fetchHealth} disabled={checking} style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6,
                  fontSize: 11, fontWeight: 500, background: "var(--surface2)", color: "var(--text2)",
                  border: "1px solid var(--border)", cursor: checking ? "not-allowed" : "pointer", opacity: checking ? 0.6 : 1,
                }}>
                  <RefreshCw size={10} style={{ animation: checking ? "spin 1s linear infinite" : "none" }} />
                  {checking ? "Prüfe…" : "Refresh"}
                </button>
              </div>

              {/* Core */}
              <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Core</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 5, marginBottom: 12 }}>
                {CORE_SERVICES.map(renderServiceCard)}
              </div>

              {/* MCP */}
              <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>MCP Server · 19 aktiv</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(110px,1fr))", gap: 5 }}>
                {MCP_SERVICES.map(renderServiceCard)}
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bento-card" style={{ padding: "16px 18px" }}>
              <ActivityFeedWidget />
            </div>
          </motion.div>
        </motion.section>

        {/* ── Automation & DevOps ───────────────────────────────────────────── */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ marginBottom: 14 }}
        >
          <motion.div variants={fadeUp}>
            <SectionHeader label="Automation & DevOps" sub="— n8n · GitHub · Docker" />
          </motion.div>
          <motion.div variants={fadeUp}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}
            className="aios-grid-r2"
          >
            <div className="bento-card" style={{ padding: "16px 18px" }}><N8NWidget /></div>
            <div className="bento-card" style={{ padding: "16px 18px" }}><GitHubStatsWidget /></div>
            <div className="bento-card" style={{ padding: "16px 18px" }}><DockerControlWidget /></div>
          </motion.div>
        </motion.section>

        {/* ── Infrastruktur ─────────────────────────────────────────────────── */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ marginBottom: 14 }}
        >
          <motion.div variants={fadeUp}>
            <SectionHeader label="Infrastruktur" sub="— Cloudflare · Coolify · MCP Health" />
          </motion.div>
          <motion.div variants={fadeUp}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}
            className="aios-grid-r3"
          >
            <div className="bento-card" style={{ padding: "16px 18px" }}><CloudflareWidget /></div>
            <div className="bento-card" style={{ padding: "16px 18px" }}><CoolifyWidget /></div>
            <div className="bento-card" style={{ padding: "16px 18px" }}><MCPHealthDashboard /></div>
          </motion.div>
        </motion.section>

        {/* ── KI-Agents ─────────────────────────────────────────────────────── */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ marginBottom: 14 }}
        >
          <motion.div variants={fadeUp}>
            <SectionHeader label="KI-Agents" sub="— Multi-Model Orchestrator" />
          </motion.div>
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <AgentOrchestratorWidget />
          </motion.div>
        </motion.section>

        {/* ── Agent Crew ────────────────────────────────────────────────────── */}
        <motion.section
          id="crew"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ marginBottom: 14 }}
        >
          <motion.div variants={fadeUp}>
            <SectionHeader label="Agent Crew" sub="— Nexus-Core Execution Engine" />
          </motion.div>
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <CrewLauncher onExecutionStart={() => {}} />
          </motion.div>
        </motion.section>

        {/* ── Content Factory ───────────────────────────────────────────────── */}
        <motion.section
          id="content-factory"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ marginBottom: 14 }}
        >
          <motion.div variants={fadeUp}>
            <SectionHeader label="Content Factory" sub="— Picsart · Fish Audio · Blog Pipeline" />
          </motion.div>
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <ContentFactoryWidget />
          </motion.div>
        </motion.section>

        {/* ── KI-Chat ───────────────────────────────────────────────────────── */}
        <motion.section
          id="ki-chat"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ marginBottom: 14 }}
        >
          <motion.div variants={fadeUp}>
            <SectionHeader label="KI-Chat" sub="— Claude · DeepSeek · Gemini · Llama" />
          </motion.div>
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <CorpChatWidget />
          </motion.div>
        </motion.section>

        {/* ── Externe Services ──────────────────────────────────────────────── */}
        <motion.section
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ marginBottom: 36 }}
        >
          <motion.div variants={fadeUp}>
            <SectionHeader label="Externe Services" />
          </motion.div>
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "14px 18px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[
                { label: "Swagger UI",   url: "https://api.automation-plus-ki.de/docs" },
                { label: "Grafana",      url: "https://grafana.automation-plus-ki.de" },
                { label: "n8n",          url: "https://n8n.automation-plus-ki.de" },
                { label: "Coolify",      url: "https://coolify.automation-plus-ki.de" },
                { label: "NocoDB",       url: "https://nocodb.automation-plus-ki.de" },
                { label: "Authentik",    url: "https://auth.automation-plus-ki.de" },
                { label: "AppFlowy",     url: "https://appflowy.automation-plus-ki.de" },
                { label: "Prometheus",   url: "https://prometheus.automation-plus-ki.de" },
                { label: "Mailpit",      url: "https://mail.automation-plus-ki.de" },
                { label: "Qdrant",       url: "https://qdrant.automation-plus-ki.de" },
                { label: "Alertmanager", url: "https://alertmanager.automation-plus-ki.de" },
                { label: "Voice AI",     url: "https://voice.automation-plus-ki.de" },
                { label: "Agents",       url: "https://agents.automation-plus-ki.de" },
                { label: "Homepage",     url: "https://dashboard.automation-plus-ki.de" },
              ].map(link => (
                <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                    textDecoration: "none", color: "var(--text2)",
                    background: "var(--surface2)", border: "1px solid var(--border)",
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = "var(--accent)"; el.style.borderColor = "var(--accent-border)"; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = "var(--text2)"; el.style.borderColor = "var(--border)"; }}
                >
                  <ExternalLink size={10} />
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{
            paddingTop: 16, borderTop: "1px solid var(--border)",
            display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8,
          }}
        >
          <p style={{ fontSize: 11, color: "var(--muted)", margin: 0 }}>
            Timo Götz · DEKRA-zertifizierter KI-Manager · automation-plus-ki.de
          </p>
          <p style={{ fontSize: 11, color: "var(--muted)", margin: 0, fontFamily: "JetBrains Mono, monospace" }}>
            {lastChecked ? `Geprüft: ${lastChecked}` : "Verbinde…"}
          </p>
        </motion.footer>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes live-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @media (max-width: 1100px) {
          .aios-grid-r1 { grid-template-columns: 1fr !important; }
          .aios-grid-r2, .aios-grid-r3 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 700px) {
          .aios-kpi-row { grid-template-columns: repeat(3, 1fr) !important; }
          .aios-grid-r2, .aios-grid-r3 { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 420px) {
          .aios-kpi-row { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
