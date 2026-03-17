import { LayoutGrid, ShieldCheck, Server, Zap, ExternalLink } from "lucide-react";
import { ProjekteGrid } from "@/components/ProjekteGrid";
import { MCPDienstePanel } from "@/components/MCPDienstePanel";
import { AuditTimeline } from "@/components/AuditTimeline";
import { store } from "@/lib/mcp-plattform-data";

export const dynamic = "force-dynamic";

const MCP_SERVERS = [
  { name: 'authentik',   label: 'Authentik',   desc: 'SSO & Identity Provider' },
  { name: 'cloudflare',  label: 'Cloudflare',  desc: 'DNS & Routing' },
  { name: 'coolify',     label: 'Coolify',     desc: 'Deployment-Plattform' },
  { name: 'filesystem',  label: 'Filesystem',  desc: 'Lokaler Dateizugriff' },
  { name: 'github',      label: 'GitHub',      desc: 'Code & PRs' },
  { name: 'google',      label: 'Google',      desc: 'Drive, Calendar, Sheets' },
  { name: 'grafana',     label: 'Grafana',     desc: 'Monitoring & Alerts' },
  { name: 'hetzner',     label: 'Hetzner',     desc: 'Cloud Infrastructure' },
  { name: 'n8n',         label: 'n8n',         desc: 'Workflow Automation' },
  { name: 'nocodb',      label: 'NocoDB',      desc: 'Datenbank-Backend' },
  { name: 'postgres',    label: 'PostgreSQL',  desc: 'Relationale Datenbank' },
  { name: 'prometheus',  label: 'Prometheus',  desc: 'Metriken & Alerting' },
  { name: 'qdrant',      label: 'Qdrant',      desc: 'Vektor-Datenbank' },
];

export default function MCPPlattformPage() {
  const projekte = store.getProjekte();
  const dienste  = store.getMCPDienste();
  const audit    = store.getAudit();

  const onlineCount  = projekte.filter((p) => p.status === "online").length;
  const warnCount    = projekte.filter((p) => p.status === "degraded").length;
  const aktivCount   = dienste.filter((d) => d.status === "aktiv").length;
  const warnAudit    = audit.filter((a) => a.ergebnis !== "OK").length;

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <LayoutGrid className="w-7 h-7 text-[#1d6ef5]" />
            MCP Plattform
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            19 Model Context Protocol Server · Hetzner 46.224.145.109 · Coolify · {projekte.length} Projekte
          </p>
        </div>
        <a
          href="https://coolify.automation-plus-ki.de"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Coolify öffnen
        </a>
      </div>

      {/* MCP Server Cards */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          MCP Server — {MCP_SERVERS.length} konfiguriert
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {MCP_SERVERS.map((mcp) => {
            const url = `https://mcp-${mcp.name}.automation-plus-ki.de`;
            return (
              <div
                key={mcp.name}
                className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex flex-col gap-3 hover:border-[#1d6ef5]/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" style={{ boxShadow: '0 0 6px rgba(34,197,94,0.5)' }} />
                    <span className="text-sm font-semibold text-slate-100">{mcp.label}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 leading-snug m-0">{mcp.desc}</p>
                <p className="text-[10px] font-mono text-slate-700 truncate m-0">mcp-{mcp.name}.automation-plus-ki.de</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors no-underline"
                  style={{ background: 'rgba(29,110,245,0.1)', color: '#1d6ef5', border: '1px solid rgba(29,110,245,0.2)' }}
                >
                  Details <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            );
          })}
        </div>
      </section>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<LayoutGrid className="w-5 h-5 text-sky-400" />}
          label="Projekte"
          value={`${onlineCount}/${projekte.length}`}
          sub="online"
          accent={onlineCount === projekte.length ? "ok" : "warn"}
        />
        <KpiCard
          icon={<Zap className="w-5 h-5 text-amber-400" />}
          label="Degraded"
          value={warnCount}
          sub="Projekte eingeschränkt"
          accent={warnCount === 0 ? "ok" : "warn"}
        />
        <KpiCard
          icon={<Server className="w-5 h-5 text-emerald-400" />}
          label="MCP-Dienste"
          value={aktivCount}
          sub="aktiv"
          accent="ok"
        />
        <KpiCard
          icon={<ShieldCheck className="w-5 h-5 text-purple-400" />}
          label="Audit-Warnungen"
          value={warnAudit}
          sub="letzte Einträge"
          accent={warnAudit === 0 ? "ok" : "warn"}
        />
      </div>

      {/* Infrastruktur-Links */}
      <section>
        <SectionLabel>Infrastruktur — Schnellzugriff</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {INFRA_LINKS.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card p-3 text-center space-y-1.5 hover:border-[#1d6ef5]/40 transition-colors group"
            >
              <span className="text-xl">{link.emoji}</span>
              <p className="text-xs font-medium text-slate-300 leading-tight group-hover:text-[#1d6ef5] transition-colors">
                {link.name}
              </p>
              <p className="text-[10px] text-slate-600 font-mono truncate">{link.label}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Governance / RACI */}
      <section>
        <SectionLabel>Governance & RACI-Matrix</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {ROLLEN.map((r) => (
            <div key={r.emoji} className="card p-3 text-center space-y-1.5">
              <span className="text-xl">{r.emoji}</span>
              <p className="text-xs font-medium text-slate-300 leading-tight">{r.name}</p>
              <p className="text-[10px] text-slate-600">{r.zugriff}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Projekte */}
      <section>
        <SectionLabel>Projekte — Status & MCP-Server</SectionLabel>
        <ProjekteGrid />
      </section>

      {/* MCP-Dienste + Audit nebeneinander */}
      <section>
        <SectionLabel>MCP-Dienste & Audit-Trail</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <MCPDienstePanel />
          </div>
          <div>
            <AuditTimeline />
          </div>
        </div>
      </section>

      {/* Mac Dev-Pfade */}
      <section>
        <SectionLabel>Lokale Entwicklung (Mac)</SectionLabel>
        <div className="card p-5 space-y-3">
          {MAC_PFADE.map((p) => (
            <div key={p.pfad} className="flex items-start gap-3">
              <span className="text-base shrink-0">{p.emoji}</span>
              <div>
                <p className="text-xs font-medium text-slate-300">{p.name}</p>
                <p className="text-[10px] font-mono text-slate-600 mt-0.5">{p.pfad}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Incident-Eskalation */}
      <section>
        <SectionLabel>Incident-Eskalation</SectionLabel>
        <div className="card p-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {ESKALATION.map((e, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`mt-0.5 w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${e.bg}`}>
                  {i + 1}
                </span>
                <div>
                  <p className="text-xs font-medium text-slate-300">{e.label}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{e.zeit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="text-center text-xs text-slate-700 pt-4">
        MCP-Plattform · {projekte.length} Projekte · {dienste.length} MCP-Dienste · Hetzner 46.224.145.109
      </footer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
      {children}
    </h2>
  );
}

function KpiCard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub: string;
  accent: "ok" | "warn";
}) {
  return (
    <div className={`bg-[#111827] border rounded-xl p-4 flex items-center gap-4 ${accent === "warn" ? "border-amber-500/30" : "border-[#1f2937]"}`}>
      <div className="p-2 rounded-lg bg-[#0a0f1a]">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-slate-400">{label} <span className="text-slate-600">· {sub}</span></p>
      </div>
    </div>
  );
}

const INFRA_LINKS = [
  { emoji: "🚀", name: "Coolify", label: "Deployments", url: "https://coolify.automation-plus-ki.de" },
  { emoji: "🔐", name: "Authentik", label: "SSO & Identity", url: "https://auth.automation-plus-ki.de" },
  { emoji: "📊", name: "Grafana", label: "Monitoring", url: "https://grafana.automation-plus-ki.de" },
  { emoji: "🔥", name: "Prometheus", label: "Metriken", url: "https://prometheus.automation-plus-ki.de" },
  { emoji: "🗃️", name: "NocoDB", label: "No-Code DB", url: "https://nocodb.automation-plus-ki.de" },
  { emoji: "⚡", name: "n8n", label: "Automation", url: "https://n8n.automation-plus-ki.de" },
];

const ROLLEN = [
  { emoji: "🏛️", name: "Platform-Owner", zugriff: "Vollzugriff" },
  { emoji: "👔", name: "Projektleiter", zugriff: "Betrieb & Orga" },
  { emoji: "🛡️", name: "Security-Lead", zugriff: "Audit & Compliance" },
  { emoji: "🔬", name: "Tech-Lead", zugriff: "Architektur" },
  { emoji: "🔧", name: "Developer", zugriff: "Projekt (eigen)" },
  { emoji: "👷", name: "Operator", zugriff: "Projekt (lesen)" },
];

const MAC_PFADE = [
  {
    emoji: "🤖",
    name: "AI Agent Platform",
    pfad: "~/Geschäft/STUDIO/03_AI_Engineering/07_Projects/03_ai-agent-platform/",
  },
  {
    emoji: "🎙️",
    name: "AI Voice Platform",
    pfad: "~/Geschäft/STUDIO/03_AI_Engineering/07_Projects/01_ai-voice-platform/",
  },
  {
    emoji: "🧪",
    name: "Bruno API Tests",
    pfad: "~/Geschäft/STUDIO/03_AI_Engineering/01_APIs/02_bruno-api-tests/",
  },
];

const ESKALATION = [
  { label: "Developer", zeit: "30 Min", bg: "bg-emerald-500/20 text-emerald-400" },
  { label: "Projektleiter", zeit: "30 Min", bg: "bg-sky-500/20 text-sky-400" },
  { label: "Tech-Lead", zeit: "15 Min", bg: "bg-amber-500/20 text-amber-400" },
  { label: "Platform-Owner", zeit: "Sofort", bg: "bg-orange-500/20 text-orange-400" },
  { label: "Security-Lead", zeit: "Sofort (kritisch)", bg: "bg-red-500/20 text-red-400" },
];
