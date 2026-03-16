"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import TopBar from "@/components/TopBar";
import {
  Monitor, Server, Activity, Bot, Database, Shield,
  Zap, Globe, ExternalLink, GitBranch, Cpu, BarChart2,
  Terminal, Network, Mic, Home, Mail, RefreshCw,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────
type ServiceStatus = "online" | "degraded" | "offline" | "unknown";

interface ServiceHealth {
  status: ServiceStatus;
  latency?: number;
}

interface CoreService {
  id: string;
  name: string;
  description: string;
  url: string;
  shortUrl: string;
  icon: React.ReactNode;
}

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: "deploy" | "dns" | "database" | "build" | "config";
}

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  type: "http" | "websocket";
  group: string;
}

interface PlatformService {
  id: string;
  name: string;
  role: string;
  url: string;
  shortUrl: string;
  icon: React.ReactNode;
}

// ── Animation Variants ────────────────────────────────────────────────────
const ease = [0.25, 0.1, 0.25, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};
const stagger = { visible: { transition: { staggerChildren: 0.06 } } };

// ── Static Data ───────────────────────────────────────────────────────────
const CORE_SERVICES: CoreService[] = [
  {
    id: "nexus-core",
    name: "Nexus-Core API",
    description: "FastAPI Backend — Agents, Tasks, Automationen",
    url: "https://api.automation-plus-ki.de",
    shortUrl: "api.automation-plus-ki.de",
    icon: <Server size={16} />,
  },
  {
    id: "infra",
    name: "Infra Monitor",
    description: "Status aller Platform-Services auf einen Blick",
    url: "https://infra.automation-plus-ki.de",
    shortUrl: "infra.automation-plus-ki.de",
    icon: <Activity size={16} />,
  },
  {
    id: "agents",
    name: "Agents Platform",
    description: "KI-Agents ausführen und orchestrieren",
    url: "https://agents.automation-plus-ki.de",
    shortUrl: "agents.automation-plus-ki.de",
    icon: <Bot size={16} />,
  },
  {
    id: "n8n",
    name: "n8n Workflows",
    description: "Workflow-Automation — Trigger, Actions, Webhooks",
    url: "https://n8n.automation-plus-ki.de",
    shortUrl: "n8n.automation-plus-ki.de",
    icon: <Network size={16} />,
  },
];

const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: "1",
    title: "Admin Dashboard deployed",
    description: "admin.automation-plus-ki.de · Docker + Traefik TLS",
    time: "Heute, 04:14",
    type: "deploy",
  },
  {
    id: "2",
    title: "Nexus-Core API deployed",
    description: "api.automation-plus-ki.de · FastAPI läuft healthy",
    time: "Heute, 04:13",
    type: "deploy",
  },
  {
    id: "3",
    title: "DNS Records angelegt",
    description: "admin.* + api.* → 46.224.145.109 via Cloudflare",
    time: "Heute, 04:06",
    type: "dns",
  },
  {
    id: "4",
    title: "PostgreSQL DB vorbereitet",
    description: "aios_db + aios_user in homestack-postgres",
    time: "Heute, 04:10",
    type: "database",
  },
  {
    id: "5",
    title: "GitHub Actions gefixt",
    description: "Build-URL korrigiert auf api.automation-plus-ki.de",
    time: "Heute, 04:05",
    type: "build",
  },
];

const API_ENDPOINTS: ApiEndpoint[] = [
  { group: "Status",  method: "GET",  path: "/health",                  description: "Service-Status & Timestamp",        type: "http" },
  { group: "Status",  method: "GET",  path: "/metrics",                 description: "Prometheus-Metriken (Text-Format)",  type: "http" },
  { group: "Status",  method: "WS",   path: "/ws/dashboard",            description: "Live-Updates — Agents & Tasks",      type: "websocket" },
  { group: "Agents",  method: "GET",  path: "/api/agents",              description: "Alle registrierten Agents",          type: "http" },
  { group: "Agents",  method: "POST", path: "/api/agents/execute",      description: "Agent mit Task starten",             type: "http" },
  { group: "Agents",  method: "GET",  path: "/api/agents/{id}/status",  description: "Status + letzte 5 Läufe",           type: "http" },
  { group: "Tasks",   method: "GET",  path: "/api/tasks",               description: "Alle Tasks, neueste zuerst",         type: "http" },
  { group: "Data",    method: "GET",  path: "/api/models",              description: "Verfügbare KI-Modelle",              type: "http" },
  { group: "Data",    method: "GET",  path: "/api/prompts",             description: "Prompt-Registry (YAML-Agenten)",     type: "http" },
  { group: "Data",    method: "GET",  path: "/api/automations",         description: "Konfigurierte Automationen",         type: "http" },
  { group: "Docs",    method: "GET",  path: "/docs",                    description: "Swagger UI — interaktiv testbar",    type: "http" },
  { group: "Docs",    method: "GET",  path: "/redoc",                   description: "ReDoc — vollständige Dokumentation", type: "http" },
];

// Nur Services die tatsächlich deployed und erreichbar sind
const PLATFORM_SERVICES: PlatformService[] = [
  { id: "nexus-core",   name: "Nexus-Core API",  role: "FastAPI Backend",      url: "https://api.automation-plus-ki.de",        shortUrl: "api.*",        icon: <Server size={15} /> },
  { id: "infra",        name: "Infra Monitor",   role: "Service-Übersicht",    url: "https://infra.automation-plus-ki.de",      shortUrl: "infra.*",      icon: <Activity size={15} /> },
  { id: "agents",       name: "Agents Platform", role: "AI Agent Hub",         url: "https://agents.automation-plus-ki.de",     shortUrl: "agents.*",     icon: <Bot size={15} /> },
  { id: "voice",        name: "Voice Platform",  role: "Voice AI",             url: "https://voice.automation-plus-ki.de",      shortUrl: "voice.*",      icon: <Mic size={15} /> },
  { id: "n8n",          name: "n8n",             role: "Workflow Automation",  url: "https://n8n.automation-plus-ki.de",        shortUrl: "n8n.*",        icon: <Network size={15} /> },
  { id: "nocodb",       name: "NocoDB",          role: "No-Code Datenbank",    url: "https://nocodb.automation-plus-ki.de",     shortUrl: "nocodb.*",     icon: <Database size={15} /> },
  { id: "grafana",      name: "Grafana",         role: "Monitoring Charts",    url: "https://grafana.automation-plus-ki.de",    shortUrl: "grafana.*",    icon: <BarChart2 size={15} /> },
  { id: "prometheus",   name: "Prometheus",      role: "Metrics Collection",   url: "https://prometheus.automation-plus-ki.de", shortUrl: "prometheus.*", icon: <Activity size={15} /> },
  { id: "appflowy",     name: "AppFlowy",        role: "Notes & Projects",     url: "https://appflowy.automation-plus-ki.de",   shortUrl: "appflowy.*",   icon: <Terminal size={15} /> },
  { id: "authentik",    name: "Authentik SSO",   role: "Identity Provider",    url: "https://auth.automation-plus-ki.de",       shortUrl: "auth.*",       icon: <Shield size={15} /> },
  { id: "mailpit",      name: "Mailpit",         role: "SMTP Catcher",         url: "https://mail.automation-plus-ki.de",       shortUrl: "mail.*",       icon: <Mail size={15} /> },
  { id: "homepage",     name: "Homepage",        role: "Service Dashboard",    url: "https://dashboard.automation-plus-ki.de",  shortUrl: "dashboard.*",  icon: <Home size={15} /> },
  { id: "qdrant",       name: "Qdrant",          role: "Vector Database",      url: "https://qdrant.automation-plus-ki.de",     shortUrl: "qdrant.*",     icon: <Database size={15} /> },
  { id: "mcp-grafana",  name: "MCP Grafana",     role: "MCP Server",           url: "https://mcp-grafana.automation-plus-ki.de",shortUrl: "mcp-grafana.*",icon: <Cpu size={15} /> },
  { id: "mcp-nocodb",   name: "MCP NocoDB",      role: "MCP Server",           url: "https://mcp-nocodb.automation-plus-ki.de", shortUrl: "mcp-nocodb.*", icon: <Cpu size={15} /> },
  { id: "mcp-postgres", name: "MCP Postgres",    role: "MCP Server",           url: "https://mcp-postgres.automation-plus-ki.de",shortUrl: "mcp-postgres.*",icon: <Cpu size={15} /> },
];

// ── Status config ─────────────────────────────────────────────────────────
const STATUS_CFG: Record<ServiceStatus, { label: string; bg: string; text: string; dot: string }> = {
  online:   { label: "Online",    bg: "#f0fdf4", text: "#16a34a", dot: "#16a34a" },
  degraded: { label: "Degraded",  bg: "#fefce8", text: "#ca8a04", dot: "#ca8a04" },
  offline:  { label: "Offline",   bg: "#fef2f2", text: "#dc2626", dot: "#dc2626" },
  unknown:  { label: "Checking…", bg: "#f8fafc", text: "#94a3b8", dot: "#cbd5e1" },
};

const ACTIVITY_ICON_CFG = {
  deploy:   { icon: <Server size={13} />,    bg: "#eff6ff", color: "#2563eb" },
  dns:      { icon: <Globe size={13} />,     bg: "#f0fdf4", color: "#16a34a" },
  database: { icon: <Database size={13} />,  bg: "#faf5ff", color: "#7c3aed" },
  build:    { icon: <GitBranch size={13} />, bg: "#fffbeb", color: "#d97706" },
  config:   { icon: <Zap size={13} />,       bg: "#eff6ff", color: "#2563eb" },
};

const METHOD_CFG: Record<string, { bg: string; text: string }> = {
  GET:  { bg: "#eff6ff", text: "#2563eb" },
  POST: { bg: "#f0fdf4", text: "#16a34a" },
  WS:   { bg: "#faf5ff", text: "#7c3aed" },
};

// ── Helpers ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ServiceStatus }) {
  const sc = STATUS_CFG[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: sc.bg, color: sc.text, whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%", background: sc.dot, flexShrink: 0,
        animation: status === "online" ? "dot-pulse 2s infinite" : "none",
      }} />
      {sc.label}
    </span>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#ffffff",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      padding: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", margin: 0 }}>{title}</p>
        {sub && <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0" }}>{sub}</p>}
      </div>
      {right}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
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
    } catch {
      // ignore
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    // Fetch API health directly
    fetch("https://api.automation-plus-ki.de/health")
      .then((r) => r.json())
      .then(setApiHealth)
      .catch(() => {});

    // Fetch all service health via server-side route
    fetchHealth();
    const interval = setInterval(fetchHealth, 60_000);

    // Clock
    const tick = () =>
      setTime(new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const clockInterval = setInterval(tick, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, [fetchHealth]);

  const getStatus = (id: string): ServiceStatus => {
    const h = serviceHealth[id];
    if (!h) return "unknown";
    return h.status as ServiceStatus;
  };

  const getLatency = (id: string): string | undefined => {
    const h = serviceHealth[id];
    if (!h?.latency) return undefined;
    return `${h.latency} ms`;
  };

  const onlineCount = Object.values(serviceHealth).filter((s) => s.status === "online").length;
  const totalChecked = Object.keys(serviceHealth).length;

  const groups = API_ENDPOINTS.reduce<Record<string, ApiEndpoint[]>>((acc, ep) => {
    (acc[ep.group] ??= []).push(ep);
    return acc;
  }, {});

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", color: "#0f172a" }}>
      <TopBar apiStatus={apiHealth?.status} currentTime={time} />

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "80px 24px 64px" }}>

        {/* ── Hero ─────────────────────────────────────────── */}
        <motion.section
          initial="hidden" animate="visible" variants={stagger}
          style={{ marginBottom: 32, paddingTop: 20 }}
        >
          <motion.div variants={fadeUp} style={{ marginBottom: 6 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 500,
              background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe",
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#2563eb", animation: "dot-pulse 2s infinite" }} />
              production · hetzner cpx42 · nuremberg · 46.224.145.109
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} style={{
            fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 700,
            letterSpacing: "-0.025em", lineHeight: 1.15, margin: "12px 0 10px",
            color: "#0f172a",
          }}>
            Automation + KI
            <span style={{ color: "#94a3b8", fontWeight: 500 }}> · Control Center</span>
          </motion.h1>

          <motion.p variants={fadeUp} style={{
            fontSize: 15, color: "#64748b", maxWidth: 520, lineHeight: 1.6, margin: 0,
          }}>
            Zentrale Steuereinheit für KI-Agents, Workflows und Infrastruktur.
            Alle Services auf einen Blick — steuerbar, überwachbar, erweiterbar.
          </motion.p>
        </motion.section>

        {/* ── KPI Row ──────────────────────────────────────── */}
        <motion.div
          initial="hidden" animate="visible" variants={stagger}
          style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}
          className="aios-kpi-row"
        >
          {[
            {
              label: "Services Online",
              value: totalChecked ? `${onlineCount} / ${totalChecked}` : "…",
              sub: totalChecked ? "Health-Check live" : "Wird geprüft…",
              accent: onlineCount > 0 ? "#16a34a" : "#94a3b8",
            },
            {
              label: "API Status",
              value: apiHealth ? "Healthy" : "Verbinde…",
              sub: "api.automation-plus-ki.de",
              accent: apiHealth ? "#16a34a" : "#ca8a04",
            },
            {
              label: "Infrastruktur",
              value: "Hetzner",
              sub: "cpx42 · Nürnberg",
              accent: "#0f172a",
            },
            {
              label: "Zuletzt geprüft",
              value: lastChecked || "…",
              sub: checking ? "Prüfe jetzt…" : "Auto alle 60s",
              accent: "#0f172a",
            },
          ].map((kpi) => (
            <motion.div key={kpi.label} variants={fadeUp}>
              <Card style={{ padding: 16 }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {kpi.label}
                </p>
                <p style={{ fontSize: 20, fontWeight: 700, margin: "0 0 2px", color: kpi.accent, letterSpacing: "-0.02em" }}>
                  {kpi.value}
                </p>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>{kpi.sub}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Activity + Core Services ──────────────────────── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}
          style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 10, marginBottom: 10 }}
          className="aios-grid-2col"
        >
          {/* Activity */}
          <motion.div variants={fadeUp}>
            <Card style={{ height: "100%" }}>
              <SectionTitle title="Letzte Aktivitäten" sub="Heute · 16. März 2026" />
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {RECENT_ACTIVITY.map((item) => {
                  const cfg = ACTIVITY_ICON_CFG[item.type];
                  return (
                    <div key={item.id} style={{ display: "flex", gap: 10 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: cfg.bg, color: cfg.color,
                      }}>
                        {cfg.icon}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, margin: 0, lineHeight: 1.3, color: "#0f172a" }}>{item.title}</p>
                          <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0, whiteSpace: "nowrap" }}>{item.time}</span>
                        </div>
                        <p style={{ fontSize: 12, color: "#64748b", margin: "2px 0 0", lineHeight: 1.4 }}>{item.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>

          {/* Core Services — real health status */}
          <motion.div variants={fadeUp}>
            <Card style={{ height: "100%" }}>
              <SectionTitle title="Kern-Services" sub="Live-Status via Health-Check" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {CORE_SERVICES.map((svc) => {
                  const status = getStatus(svc.id);
                  const latency = getLatency(svc.id);
                  return (
                    <motion.a
                      key={svc.id}
                      href={svc.url}
                      target="_blank" rel="noopener noreferrer"
                      whileHover={{ y: -1 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        display: "block", padding: 14, borderRadius: 10, textDecoration: "none",
                        background: "#f8fafc", border: "1px solid #e2e8f0",
                        transition: "border-color 0.15s, box-shadow 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = "#cbd5e1";
                        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                      }}
                      onMouseLeave={(e) => {
                        const el = e.currentTarget as HTMLAnchorElement;
                        el.style.borderColor = "#e2e8f0";
                        el.style.boxShadow = "none";
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "#e2e8f0", color: "#475569",
                        }}>
                          {svc.icon}
                        </div>
                        <StatusBadge status={status} />
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 3px", color: "#0f172a" }}>{svc.name}</p>
                      <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 8px", lineHeight: 1.4 }}>{svc.description}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>{svc.shortUrl}</span>
                        {latency && <span style={{ fontSize: 11, color: "#94a3b8" }}>{latency}</span>}
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* ── API Endpoints ─────────────────────────────────── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}
          style={{ marginBottom: 10 }}
        >
          <motion.div variants={fadeUp}>
            <Card>
              <SectionTitle
                title="API & Endpoints"
                sub="api.automation-plus-ki.de — REST + WebSocket"
                right={
                  <div style={{ display: "flex", gap: 6 }}>
                    <a href="https://api.automation-plus-ki.de/docs" target="_blank" rel="noopener noreferrer"
                      style={{ padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 500, textDecoration: "none", background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                      Swagger ↗
                    </a>
                    <a href="https://api.automation-plus-ki.de/redoc" target="_blank" rel="noopener noreferrer"
                      style={{ padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 500, textDecoration: "none", background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}>
                      ReDoc ↗
                    </a>
                  </div>
                }
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 24 }}>
                {Object.entries(groups).map(([group, endpoints]) => (
                  <div key={group}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8", margin: "0 0 8px" }}>
                      {group}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {endpoints.map((ep) => {
                        const mc = METHOD_CFG[ep.method] ?? { bg: "#f8fafc", text: "#64748b" };
                        return (
                          <a key={ep.path}
                            href={ep.type === "http" ? `https://api.automation-plus-ki.de${ep.path}` : undefined}
                            target={ep.type === "http" ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              padding: "6px 8px", borderRadius: 7,
                              background: "transparent", border: "1px solid transparent",
                              textDecoration: "none", transition: "background 0.12s, border-color 0.12s",
                            }}
                            onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "#f8fafc"; el.style.borderColor = "#e2e8f0"; }}
                            onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = "transparent"; el.style.borderColor = "transparent"; }}
                          >
                            <span style={{ fontSize: 9, fontWeight: 700, fontFamily: "monospace", padding: "2px 5px", borderRadius: 4, background: mc.bg, color: mc.text, flexShrink: 0 }}>
                              {ep.method}
                            </span>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <p style={{ fontSize: 12, fontFamily: "monospace", color: "#0f172a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.path}</p>
                              <p style={{ fontSize: 11, color: "#94a3b8", margin: "1px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.description}</p>
                            </div>
                            {ep.type === "http" && <ExternalLink size={10} style={{ color: "#cbd5e1", flexShrink: 0 }} />}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* ── Platform Overview — real health status ──────── */}
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <Card>
              <SectionTitle
                title="Plattform-Übersicht"
                sub="automation-plus-ki.de · alle aktiven Services"
                right={
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      onClick={fetchHealth}
                      disabled={checking}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 10px", borderRadius: 7, fontSize: 12, fontWeight: 500,
                        background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0",
                        cursor: checking ? "not-allowed" : "pointer", opacity: checking ? 0.6 : 1,
                      }}
                    >
                      <RefreshCw size={11} style={{ animation: checking ? "spin 1s linear infinite" : "none" }} />
                      {checking ? "Prüfe…" : "Aktualisieren"}
                    </button>
                    <a href="https://infra.automation-plus-ki.de" target="_blank" rel="noopener noreferrer"
                      style={{ fontSize: 12, color: "#2563eb", textDecoration: "none" }}>
                      Infra Monitor ↗
                    </a>
                  </div>
                }
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
                {PLATFORM_SERVICES.map((svc) => {
                  const status = getStatus(svc.id);
                  const sc = STATUS_CFG[status];
                  return (
                    <motion.a
                      key={svc.id}
                      href={svc.url}
                      target="_blank" rel="noopener noreferrer"
                      whileHover={{ y: -1 }}
                      transition={{ duration: 0.14 }}
                      style={{
                        display: "flex", flexDirection: "column", alignItems: "center",
                        gap: 7, padding: "14px 10px", borderRadius: 10, textAlign: "center",
                        background: "#f8fafc", border: "1px solid #e2e8f0",
                        textDecoration: "none", transition: "border-color 0.15s, box-shadow 0.15s",
                      }}
                      onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "#cbd5e1"; el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)"; }}
                      onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = "#e2e8f0"; el.style.boxShadow = "none"; }}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 9,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "#e2e8f0", color: "#475569",
                      }}>
                        {svc.icon}
                      </div>
                      <div style={{ width: "100%" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: "#0f172a", lineHeight: 1.3 }}>{svc.name}</p>
                        <p style={{ fontSize: 10, color: "#94a3b8", margin: "2px 0 4px" }}>{svc.role}</p>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 3,
                          fontSize: 10, fontWeight: 500, color: sc.text,
                        }}>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
                          {sc.label}
                        </span>
                      </div>
                    </motion.a>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          style={{
            marginTop: 40, paddingTop: 20,
            borderTop: "1px solid #e2e8f0",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            flexWrap: "wrap", gap: 8,
          }}
        >
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            Automation + KI · admin.automation-plus-ki.de · Hetzner cpx42 Nuremberg
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
            {apiHealth?.timestamp
              ? `API: ${new Date(apiHealth.timestamp).toLocaleString("de-DE")}`
              : "Verbinde mit API…"}
          </p>
        </motion.footer>
      </main>

      <style>{`
        @keyframes dot-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 900px) { .aios-grid-2col { grid-template-columns: 1fr !important; } }
        @media (max-width: 700px) { .aios-kpi-row { grid-template-columns: 1fr 1fr !important; } }
      `}</style>
    </div>
  );
}
