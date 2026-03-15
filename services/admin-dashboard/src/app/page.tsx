import {
  Activity, ShieldCheck, AlertTriangle, Globe, GitBranch,
  Cpu, Server, LayoutGrid, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { GitHubStatsWidget } from "@/components/GitHubStatsWidget";
import { ActivityFeedWidget } from "@/components/ActivityFeedWidget";
import { N8NWidget } from "@/components/N8NWidget";
import { DockerControlWidget } from "@/components/DockerControlWidget";
import { CloudflareWidget } from "@/components/CloudflareWidget";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  return (
    <main className="p-5 min-h-screen bg-[#070b14]">

      {/* ── Bento Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 auto-rows-min">

        {/* ── Row 1 ─────────────────────────────────────────────────── */}

        {/* Core Infrastructure — 2 col */}
        <div className="md:col-span-2 bento-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#1d6ef5]" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-[#1d6ef5]">
                Core Infrastructure
              </h2>
            </div>
            <span className="text-[10px] bg-cyan-400/10 text-cyan-400 px-2 py-0.5 rounded font-semibold">
              Hetzner 46.224.145.109
            </span>
          </div>
          <div className="space-y-2">
            {INFRA_SERVICES.map((s) => (
              <ServiceRow key={s.name} {...s} />
            ))}
          </div>
        </div>

        {/* AI Agents — 1 col */}
        <div className="bento-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-4 h-4 text-slate-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">
              AI Projects
            </h2>
          </div>
          <div className="space-y-2">
            {AI_PROJECTS.map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 bg-[#070b14] border border-[#1a2540] rounded-lg hover:border-[#1d6ef5]/30 transition-colors group"
              >
                <div>
                  <div className="text-xs font-semibold text-zinc-200 group-hover:text-white">{p.name}</div>
                  <div className="text-[9px] text-zinc-600 font-mono mt-0.5">{p.stack}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${p.status === "online" ? "status-online live-dot" : "status-warn"}`} />
                  <ExternalLink className="w-2.5 h-2.5 text-zinc-700 group-hover:text-zinc-400" />
                </div>
              </a>
            ))}
          </div>
          <Link
            href="/agentic-os/engine-room/agents"
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg bg-[#1d6ef5]/10 border border-[#1d6ef5]/20 text-[10px] text-[#1d6ef5] font-semibold hover:bg-[#1d6ef5]/15 transition-colors"
          >
            🚀 Crew starten
          </Link>
        </div>

        {/* Security Checklist — 1 col */}
        <div className="bento-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-cyan-500">
              Security
            </h2>
          </div>
          <ul className="space-y-2.5">
            {SECURITY_CHECKS.map((c) => (
              <SecurityItem key={c.label} {...c} />
            ))}
          </ul>
        </div>

        {/* ── Row 2 ─────────────────────────────────────────────────── */}

        {/* GitHub Stats — 1 col */}
        <div className="bento-card overflow-hidden">
          <GitHubStatsWidget />
        </div>

        {/* Activity Feed — 2 col */}
        <div className="md:col-span-2 bento-card overflow-hidden">
          <ActivityFeedWidget />
        </div>

        {/* Critical Issues — 1 col */}
        <div className="bento-card p-5 border-red-500/20 bg-red-500/[0.03]">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-red-500">
              Critical Issues
            </h2>
          </div>
          <div className="space-y-2">
            {CRITICAL_ISSUES.map((issue) => (
              <div
                key={issue.service}
                className="p-2.5 bg-red-500/5 border border-red-500/15 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full status-offline shrink-0" />
                  <span className="text-[10px] font-semibold text-red-400">{issue.service}</span>
                </div>
                <p className="text-[9px] text-red-500/60 mt-0.5 ml-3.5">{issue.detail}</p>
              </div>
            ))}
            {CRITICAL_ISSUES.length === 0 && (
              <p className="text-[10px] text-zinc-600 text-center py-4">Keine kritischen Issues</p>
            )}
          </div>
          <Link
            href="/mcp-plattform"
            className="mt-3 text-[10px] text-zinc-600 hover:text-zinc-400 block text-center transition-colors"
          >
            MCP-Plattform öffnen →
          </Link>
        </div>

        {/* ── Row 3 ─────────────────────────────────────────────────── */}

        {/* Docker Control — 1 col */}
        <div className="bento-card overflow-hidden">
          <DockerControlWidget />
        </div>

        {/* Cloudflare — 1 col */}
        <div className="bento-card overflow-hidden">
          <CloudflareWidget />
        </div>

        {/* n8n Workflows — 1 col */}
        <div className="bento-card overflow-hidden">
          <N8NWidget />
        </div>

        {/* MCP Server Status — 1 col */}
        <div className="bento-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-purple-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400">
              MCP Status
            </h2>
          </div>
          <div className="space-y-1.5">
            {MCP_STATUS.map((m) => (
              <div key={m.name} className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400">{m.name}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-zinc-500">{m.health}%</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${m.health >= 90 ? "status-online" : m.health >= 50 ? "status-warn" : "status-offline"} ${m.health >= 90 ? "live-dot" : ""}`} />
                </div>
              </div>
            ))}
          </div>
          <Link
            href="/mcp-plattform"
            className="mt-4 text-[10px] text-[#1d6ef5]/60 hover:text-[#1d6ef5] block text-center transition-colors"
          >
            Alle MCP-Dienste →
          </Link>
        </div>

        {/* ── Row 4 — Tools & Quick Links ───────────────────────────── */}
        <div className="md:col-span-4 bento-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-3.5 h-3.5 text-zinc-600" />
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">
              Quick Access — Infrastruktur
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target={l.url.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#070b14] border border-[#1a2540] rounded-lg text-[10px] text-zinc-500 hover:text-zinc-200 hover:border-[#1d6ef5]/30 transition-colors font-medium"
              >
                <span>{l.icon}</span>
                {l.label}
              </a>
            ))}
          </div>
        </div>

      </div>

      <footer className="text-center text-[10px] text-zinc-800 pt-6 pb-2">
        automation-plus-ki.de · Hetzner 46.224.145.109 · {new Date().getFullYear()}
      </footer>
    </main>
  );
}

// ── Sub-Komponenten ─────────────────────────────────────────────────────────

function ServiceRow({ name, status, url, icon }: {
  name: string; status: "online" | "degraded" | "offline"; url?: string; icon: string;
}) {
  const statusColor = status === "online" ? "text-cyan-400" : status === "degraded" ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex items-center justify-between p-2.5 bg-[#070b14]/80 border border-[#1a2540]/50 rounded-lg hover:bg-[#0d1321] transition-all group">
      <div className="flex items-center gap-2.5">
        <span className="text-sm">{icon}</span>
        <div>
          <div className="text-xs font-semibold text-zinc-200">{name}</div>
          {url && <div className="text-[9px] text-zinc-600 font-mono">{url}</div>}
        </div>
      </div>
      <div className={`text-[9px] font-black uppercase ${statusColor} flex items-center gap-1`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status === "online" ? "status-online live-dot" : status === "degraded" ? "status-warn" : "status-offline"}`} />
        {status}
      </div>
    </div>
  );
}

function SecurityItem({ label, checked }: { label: string; checked: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${
        checked ? "bg-cyan-400/15 border-cyan-400/50" : "bg-red-500/15 border-red-500/40"
      }`}>
        {checked && <div className="w-1.5 h-1.5 bg-cyan-400 rounded-sm" />}
      </div>
      <span className={`text-[10px] ${checked ? "text-zinc-300" : "text-zinc-600"}`}>{label}</span>
    </li>
  );
}

// ── Statische Daten ──────────────────────────────────────────────────────────

const INFRA_SERVICES = [
  { name: "Coolify",       status: "online"   as const, url: "coolify.automation-plus-ki.de",    icon: "🚀" },
  { name: "Authentik SSO", status: "online"   as const, url: "auth.automation-plus-ki.de",       icon: "🔐" },
  { name: "Grafana",       status: "online"   as const, url: "grafana.automation-plus-ki.de",    icon: "📊" },
  { name: "n8n",           status: "online"   as const, url: "n8n.automation-plus-ki.de",        icon: "⚡" },
  { name: "NocoDB",        status: "online"   as const, url: "nocodb.automation-plus-ki.de",     icon: "🗃️" },
  { name: "Prometheus",    status: "online"   as const, url: "prometheus.automation-plus-ki.de", icon: "🔥" },
];

const AI_PROJECTS = [
  { name: "AI Agent Platform", stack: "Next.js + FastAPI", status: "online",   url: "https://agents.automation-plus-ki.de" },
  { name: "AI Voice Platform", stack: "Voice AI · STT/TTS", status: "online",  url: "https://voice.automation-plus-ki.de" },
];

const SECURITY_CHECKS = [
  { label: "Authentik SSO aktiv",         checked: true  },
  { label: "Cloudflare Tunnel",           checked: true  },
  { label: "Coolify Tailscale-only",      checked: true  },
  { label: "HTTPS überall",               checked: true  },
  { label: "Backup-Strategie",            checked: false },
  { label: "MCP Vaultwarden healthy",     checked: false },
];

const CRITICAL_ISSUES = [
  { service: "MCP Nextcloud",    detail: "Container unhealthy — health check failed" },
  { service: "MCP Vaultwarden", detail: "Container unhealthy — health check failed" },
];

const MCP_STATUS = [
  { name: "MCP GitHub",     health: 99 },
  { name: "MCP Postgres",   health: 98 },
  { name: "MCP Coolify",    health: 99 },
  { name: "MCP Grafana",    health: 97 },
  { name: "MCP Nextcloud",  health: 41 },
  { name: "MCP Vaultwarden", health: 38 },
];

const QUICK_LINKS = [
  { icon: "🚀", label: "Coolify",     url: "https://coolify.automation-plus-ki.de" },
  { icon: "🔐", label: "Authentik",   url: "https://auth.automation-plus-ki.de" },
  { icon: "📊", label: "Grafana",     url: "https://grafana.automation-plus-ki.de" },
  { icon: "⚡", label: "n8n",         url: "https://n8n.automation-plus-ki.de" },
  { icon: "🗃️", label: "NocoDB",      url: "https://nocodb.automation-plus-ki.de" },
  { icon: "🧪", label: "Hoppscotch",  url: "https://hoppscotch.automation-plus-ki.de" },
  { icon: "📝", label: "AppFlowy",    url: "https://appflowy.automation-plus-ki.de" },
  { icon: "☁️", label: "Nextcloud",   url: "https://nextcloud.automation-plus-ki.de" },
  { icon: "🖥️", label: "Hetzner",     url: "https://console.hetzner.cloud" },
  { icon: "🤖", label: "Agents",      url: "https://agents.automation-plus-ki.de" },
  { icon: "🎙️", label: "Voice",       url: "https://voice.automation-plus-ki.de" },
  { icon: "🗺️", label: "Agentic OS",  url: "/agentic-os" },
  { icon: "⚙️", label: "MCP-Plattform", url: "/mcp-plattform" },
  { icon: "🐻", label: "Bruno Tests", url: "/agentic-os/management/ai-ops" },
  { icon: "🎭", label: "Playwright",  url: "https://playwright.dev" },
];
