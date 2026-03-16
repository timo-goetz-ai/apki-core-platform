"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import { GitHubStatsWidget } from "@/components/GitHubStatsWidget";
import { ActivityFeedWidget } from "@/components/ActivityFeedWidget";
import { N8NWidget } from "@/components/N8NWidget";
import { DockerControlWidget } from "@/components/DockerControlWidget";
import { CloudflareWidget } from "@/components/CloudflareWidget";
import { ServiceLinks } from "@/components/ServiceLinks";
import { AgentOrchestratorWidget } from "@/components/AgentOrchestratorWidget";
import { MCPHealthDashboard } from "@/components/MCPHealthDashboard";
import { CrewLauncher } from "@/components/CrewLauncher";
import { CoolifyWidget } from "@/components/CoolifyWidget";
import {
  Server, Activity, Bot, Database, Shield,
  ExternalLink, Cpu, BarChart2, Terminal, Network, Mic, Home, Mail, RefreshCw,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type ServiceStatus = "online" | "degraded" | "offline" | "unknown";
interface ServiceHealth { status: ServiceStatus; latency?: number; }

const stagger = { visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: [0.25, 0.1, 0.25, 1] as const } },
};

// ── Platform services ──────────────────────────────────────────────────────
const PLATFORM_SERVICES = [
  { id: "nexus-core",    name: "Nexus-Core",    role: "FastAPI",     url: "https://api.automation-plus-ki.de",          icon: <Server size={13} /> },
  { id: "infra",         name: "Infra Monitor", role: "Status",      url: "https://infra.automation-plus-ki.de",        icon: <Activity size={13} /> },
  { id: "agents",        name: "Agents",        role: "AI Hub",      url: "https://agents.automation-plus-ki.de",       icon: <Bot size={13} /> },
  { id: "voice",         name: "Voice",         role: "Voice AI",    url: "https://voice.automation-plus-ki.de",        icon: <Mic size={13} /> },
  { id: "n8n",           name: "n8n",           role: "Automation",  url: "https://n8n.automation-plus-ki.de",          icon: <Network size={13} /> },
  { id: "nocodb",        name: "NocoDB",        role: "Database",    url: "https://nocodb.automation-plus-ki.de",       icon: <Database size={13} /> },
  { id: "grafana",       name: "Grafana",       role: "Monitoring",  url: "https://grafana.automation-plus-ki.de",      icon: <BarChart2 size={13} /> },
  { id: "prometheus",    name: "Prometheus",    role: "Metrics",     url: "https://prometheus.automation-plus-ki.de",   icon: <Activity size={13} /> },
  { id: "appflowy",      name: "AppFlowy",      role: "Notes",       url: "https://appflowy.automation-plus-ki.de",     icon: <Terminal size={13} /> },
  { id: "authentik",     name: "Authentik",     role: "SSO",         url: "https://auth.automation-plus-ki.de",         icon: <Shield size={13} /> },
  { id: "mailpit",       name: "Mailpit",       role: "SMTP",        url: "https://mail.automation-plus-ki.de",         icon: <Mail size={13} /> },
  { id: "homepage",      name: "Homepage",      role: "Dashboard",   url: "https://dashboard.automation-plus-ki.de",    icon: <Home size={13} /> },
  { id: "qdrant",        name: "Qdrant",        role: "Vector DB",   url: "https://qdrant.automation-plus-ki.de",       icon: <Database size={13} /> },
  { id: "mcp-grafana",   name: "MCP Grafana",   role: "MCP",         url: "https://mcp-grafana.automation-plus-ki.de",  icon: <Cpu size={13} /> },
  { id: "mcp-nocodb",    name: "MCP NocoDB",    role: "MCP",         url: "https://mcp-nocodb.automation-plus-ki.de",   icon: <Cpu size={13} /> },
  { id: "mcp-postgres",  name: "MCP Postgres",  role: "MCP",         url: "https://mcp-postgres.automation-plus-ki.de", icon: <Cpu size={13} /> },
  { id: "mcp-prometheus",name: "MCP Prometheus",role: "MCP",         url: "https://mcp-prometheus.automation-plus-ki.de",icon: <Cpu size={13} /> },
  { id: "mcp-qdrant",    name: "MCP Qdrant",    role: "MCP",         url: "https://mcp-qdrant.automation-plus-ki.de",   icon: <Cpu size={13} /> },
  { id: "mcp-filesystem",name: "MCP Filesystem",role: "MCP",         url: "https://mcp-filesystem.automation-plus-ki.de",icon: <Cpu size={13} /> },
  { id: "mcp-authentik", name: "MCP Authentik", role: "MCP",         url: "https://mcp-authentik.automation-plus-ki.de", icon: <Cpu size={13} /> },
  { id: "mcp-n8n",       name: "MCP n8n",       role: "MCP",         url: "https://mcp-n8n.automation-plus-ki.de",      icon: <Cpu size={13} /> },
  { id: "mcp-github",    name: "MCP GitHub",    role: "MCP",         url: "https://mcp-github.automation-plus-ki.de",   icon: <Cpu size={13} /> },
  { id: "mcp-cloudflare",name: "MCP Cloudflare",role: "MCP",         url: "https://mcp-cloudflare.automation-plus-ki.de",icon: <Cpu size={13} /> },
  { id: "mcp-google",    name: "MCP Google",    role: "MCP",         url: "https://mcp-google.automation-plus-ki.de",   icon: <Cpu size={13} /> },
  { id: "mcp-hetzner",   name: "MCP Hetzner",   role: "MCP",         url: "https://mcp-hetzner.automation-plus-ki.de",  icon: <Cpu size={13} /> },
  { id: "mcp-coolify",   name: "MCP Coolify",   role: "MCP",         url: "https://mcp-coolify.automation-plus-ki.de",  icon: <Cpu size={13} /> },
];

// ── Quick links ────────────────────────────────────────────────────────────
const QUICK_LINKS = [
  { label: "Swagger UI",  url: "https://api.automation-plus-ki.de/docs" },
  { label: "Grafana",     url: "https://grafana.automation-plus-ki.de" },
  { label: "n8n Flows",   url: "https://n8n.automation-plus-ki.de" },
  { label: "Coolify",     url: "https://coolify.automation-plus-ki.de" },
  { label: "NocoDB",      url: "https://nocodb.automation-plus-ki.de" },
  { label: "Authentik",   url: "https://auth.automation-plus-ki.de" },
  { label: "AppFlowy",    url: "https://appflowy.automation-plus-ki.de" },
  { label: "Prometheus",  url: "https://prometheus.automation-plus-ki.de" },
  { label: "Bruno Tests", url: "https://agents.automation-plus-ki.de" },
  { label: "Playwright",  url: "https://agents.automation-plus-ki.de" },
  { label: "Mailpit",     url: "https://mail.automation-plus-ki.de" },
  { label: "Qdrant",      url: "https://qdrant.automation-plus-ki.de" },
];

const STATUS_CFG = {
  online:   { color: "var(--positive)", label: "online"   },
  degraded: { color: "var(--warn)",     label: "degraded" },
  offline:  { color: "var(--danger)",   label: "offline"  },
  unknown:  { color: "var(--muted)",    label: "…"        },
};

// ── Page ───────────────────────────────────────────────────────────────────
export default function OverviewPage() {
  const [apiHealth, setApiHealth] = useState<{ status: string; timestamp: string } | null>(null);
  const [serviceHealth, setServiceHealth] = useState<Record<string, ServiceHealth>>({});
  const [lastChecked, setLastChecked] = useState<string>("");
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
  const onlineCount = Object.values(serviceHealth).filter(s => s.status === "online").length;
  const totalChecked = Object.keys(serviceHealth).length;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <TopBar apiStatus={apiHealth?.status} currentTime={time} />

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "68px 20px 64px" }}>

        {/* ── Hero + KPI ─────────────────────────────────────────────────── */}
        <motion.section initial="hidden" animate="visible" variants={stagger} style={{ marginBottom: 20 }}>

          <motion.div variants={fadeUp} style={{ marginBottom: 10 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px",
              borderRadius: 20, fontSize: 11, fontWeight: 500,
              background: "var(--accent-bg)", color: "var(--accent)",
              border: "1px solid var(--accent-border)",
            }}>
              <span className="live-dot status-online"
                style={{ width: 5, height: 5, borderRadius: "50%", display: "inline-block" }} />
              production · hetzner cpx42 · nuremberg · 46.224.145.109
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} style={{
            fontSize: "clamp(22px, 2.8vw, 30px)", fontWeight: 700,
            letterSpacing: "-0.022em", lineHeight: 1.25, margin: "0 0 6px",
            color: "var(--text)",
          }}>
            Automation + KI
            <span style={{ color: "var(--muted)", fontWeight: 400 }}> · Control Center</span>
          </motion.h1>

          <motion.p variants={fadeUp} style={{ fontSize: 14, color: "var(--text2)", maxWidth: 460, lineHeight: 1.6, margin: "0 0 20px" }}>
            Zentrale Steuereinheit für KI-Agents, Workflows und Infrastruktur.
          </motion.p>

          {/* KPI Row */}
          <motion.div variants={fadeUp}
            style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}
            className="aios-kpi-row"
          >
            {[
              { label: "Services Online", value: totalChecked ? `${onlineCount} / ${totalChecked}` : "—", sub: "Health-Check live",      positive: onlineCount > 0 },
              { label: "API Status",      value: apiHealth ? "Healthy" : "Verbinde…",                    sub: "api.automation-plus-ki.de", positive: !!apiHealth },
              { label: "Infrastruktur",   value: "Hetzner cpx42",                                        sub: "Nürnberg · 46.224.145.109", positive: null },
              { label: "Zuletzt geprüft", value: lastChecked || "—",                                     sub: checking ? "Prüfe…" : "Auto alle 60s", positive: null },
            ].map(kpi => (
              <div key={kpi.label} className="bento-card" style={{ padding: "14px 16px" }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{kpi.label}</p>
                <p style={{
                  fontSize: 18, fontWeight: 700, margin: "0 0 3px", letterSpacing: "-0.02em",
                  color: kpi.positive === true ? "var(--positive)" : kpi.positive === false ? "var(--warn)" : "var(--text)",
                }}>{kpi.value}</p>
                <p style={{ fontSize: 11, color: "var(--text2)", margin: 0 }}>{kpi.sub}</p>
              </div>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Quick Links ──────────────────────────────────────────────────── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ marginBottom: 10 }}
        >
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "14px 16px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Quick Links
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK_LINKS.map(link => (
                <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 4,
                    padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                    textDecoration: "none", color: "var(--text2)",
                    background: "var(--surface2)", border: "1px solid var(--border)",
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.color = "var(--accent)";
                    el.style.borderColor = "var(--accent-border)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLAnchorElement;
                    el.style.color = "var(--text2)";
                    el.style.borderColor = "var(--border)";
                  }}
                >
                  <ExternalLink size={10} />
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        </motion.div>

        {/* ── Row 1: Platform Health + Activity ───────────────────────────── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 10, marginBottom: 10 }}
          className="aios-grid-r1"
        >
          {/* Service health grid */}
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>Plattform-Übersicht</p>
                <p style={{ fontSize: 11, color: "var(--text2)", margin: "2px 0 0" }}>automation-plus-ki.de · {totalChecked} Services</p>
              </div>
              <button onClick={fetchHealth} disabled={checking} style={{
                display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6,
                fontSize: 11, fontWeight: 500,
                background: "var(--surface2)", color: "var(--text2)",
                border: "1px solid var(--border)", cursor: checking ? "not-allowed" : "pointer",
                opacity: checking ? 0.6 : 1,
              }}>
                <RefreshCw size={10} style={{ animation: checking ? "spin 1s linear infinite" : "none" }} />
                {checking ? "…" : "Refresh"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(115px,1fr))", gap: 6 }}>
              {PLATFORM_SERVICES.map(svc => {
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
                      <span style={{ color: "var(--muted)" }}>{svc.icon}</span>
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
                      <p style={{ fontSize: 10, color: "var(--text2)", margin: "1px 0 0", fontFamily: lat ? "JetBrains Mono, monospace" : "inherit" }}>{lat ?? svc.role}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </motion.div>

          {/* Activity Feed */}
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <ActivityFeedWidget />
          </motion.div>
        </motion.div>

        {/* ── Row 2: GitHub + N8N + Docker ─────────────────────────────────── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}
          className="aios-grid-r2"
        >
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <GitHubStatsWidget />
          </motion.div>
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <N8NWidget />
          </motion.div>
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <DockerControlWidget />
          </motion.div>
        </motion.div>

        {/* ── Row 3: Agent Orchestrator ─────────────────────────────────────── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ marginBottom: 10 }}
        >
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <AgentOrchestratorWidget />
          </motion.div>
        </motion.div>

        {/* ── Row 4: Cloudflare + Coolify + MCP Health ─────────────────────── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}
          className="aios-grid-r4"
        >
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <CloudflareWidget />
          </motion.div>
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <CoolifyWidget />
          </motion.div>
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <MCPHealthDashboard />
          </motion.div>
        </motion.div>

        {/* ── Row 5: Crew Launcher full width ──────────────────────────────── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ marginBottom: 10 }}
        >
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "16px 18px" }}>
            <CrewLauncher onExecutionStart={() => {}} />
          </motion.div>
        </motion.div>

        {/* ── Service Links ─────────────────────────────────────────────────── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-20px" }} variants={stagger}
          style={{ marginBottom: 40 }}
        >
          <motion.div variants={fadeUp} className="bento-card" style={{ padding: "14px 16px" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--muted)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Service Links
            </p>
            <ServiceLinks />
          </motion.div>
        </motion.div>

        {/* Footer — Brand Signature */}
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
            {apiHealth?.timestamp
              ? new Date(apiHealth.timestamp).toLocaleString("de-DE")
              : "Verbinde…"}
          </p>
        </motion.footer>
      </main>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 1100px) {
          .aios-grid-r1 { grid-template-columns: 1fr !important; }
          .aios-grid-r2, .aios-grid-r3, .aios-grid-r4 { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 680px) {
          .aios-kpi-row { grid-template-columns: 1fr 1fr !important; }
          .aios-grid-r2, .aios-grid-r3, .aios-grid-r4 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
