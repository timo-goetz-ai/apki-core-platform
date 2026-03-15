import { Building2, ShieldCheck, Users, Zap } from "lucide-react";
import { BezirkeGrid } from "@/components/BezirkeGrid";
import { MitarbeiterPanel } from "@/components/MitarbeiterPanel";
import { AuditTimeline } from "@/components/AuditTimeline";
import { store } from "@/lib/mcp-stadt-data";

export const dynamic = "force-dynamic";

export default function MCPStadtPage() {
  const bezirke     = store.getBezirke();
  const mitarbeiter = store.getMitarbeiter();
  const audit       = store.getAudit();

  const onlineCount  = bezirke.filter((b) => b.status === "online").length;
  const warnCount    = bezirke.filter((b) => b.status === "degraded").length;
  const aktivCount   = mitarbeiter.filter((m) => m.status === "aktiv").length;
  const warnAudit    = audit.filter((a) => a.ergebnis !== "OK").length;

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <Building2 className="w-7 h-7 text-[#1d6ef5]" />
            MCP-Stadt Verwaltung
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Zentrale Steuerung aller MCP-Server, Bezirke & Mitarbeiter
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          icon={<Building2 className="w-5 h-5 text-sky-400" />}
          label="Bezirke"
          value={`${onlineCount}/${bezirke.length}`}
          sub="online"
          accent={onlineCount === bezirke.length ? "ok" : "warn"}
        />
        <KpiCard
          icon={<Zap className="w-5 h-5 text-amber-400" />}
          label="Degraded"
          value={warnCount}
          sub="Bezirke eingeschränkt"
          accent={warnCount === 0 ? "ok" : "warn"}
        />
        <KpiCard
          icon={<Users className="w-5 h-5 text-emerald-400" />}
          label="Mitarbeiter"
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

      {/* Governance Übersicht (statisch) */}
      <section>
        <SectionLabel>Governance & Rollen</SectionLabel>
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

      {/* Bezirke */}
      <section>
        <SectionLabel>Bezirke — MCP-Server Status</SectionLabel>
        <BezirkeGrid />
      </section>

      {/* Mitarbeiter + Audit nebeneinander */}
      <section>
        <SectionLabel>Mitarbeiter & Audit-Trail</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <MitarbeiterPanel />
          </div>
          <div>
            <AuditTimeline />
          </div>
        </div>
      </section>

      {/* Incident Eskalation (Info-Card) */}
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
        MCP-Stadt · {bezirke.length} Bezirke · {mitarbeiter.length} Mitarbeiter
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

const ROLLEN = [
  { emoji: "🏛️", name: "Bürgermeister", zugriff: "Vollzugriff" },
  { emoji: "👔", name: "Projektleiter", zugriff: "Betrieb & Orga" },
  { emoji: "🛡️", name: "Security-Lead", zugriff: "Audit & Compliance" },
  { emoji: "🔬", name: "Tech-Lead", zugriff: "Architektur" },
  { emoji: "🔧", name: "Entwickler", zugriff: "Bezirk (eigen)" },
  { emoji: "👷", name: "Operator", zugriff: "Bezirk (lesen)" },
];

const ESKALATION = [
  { label: "Mitarbeiter", zeit: "30 Min", bg: "bg-emerald-500/20 text-emerald-400" },
  { label: "Bezirksleiter", zeit: "30 Min", bg: "bg-sky-500/20 text-sky-400" },
  { label: "Tech-Lead", zeit: "15 Min", bg: "bg-amber-500/20 text-amber-400" },
  { label: "Projektleiter", zeit: "Sofort", bg: "bg-orange-500/20 text-orange-400" },
  { label: "Security-Lead", zeit: "Sofort (kritisch)", bg: "bg-red-500/20 text-red-400" },
];
