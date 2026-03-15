import { Bot, CheckCircle2, Clock, Cpu, LayoutDashboard, Zap } from "lucide-react";
import { fetchAgents, fetchHealth, fetchPrompts, fetchTasks } from "@/lib/api";
import { ServiceLinks } from "@/components/ServiceLinks";
import { StatusBadge } from "@/components/StatusBadge";
import { MacProjectsWidget } from "@/components/MacProjectsWidget";
import { DockerControlWidget } from "@/components/DockerControlWidget";
import { CloudflareWidget } from "@/components/CloudflareWidget";
import { CoolifyWidget } from "@/components/CoolifyWidget";
import { GitHubStatsWidget } from "@/components/GitHubStatsWidget";
import { CorporatePromptWidget } from "@/components/CorporatePromptWidget";

export const dynamic = "force-dynamic";

async function getData() {
  try {
    const [health, agents, tasks, prompts] = await Promise.allSettled([
      fetchHealth(),
      fetchAgents(),
      fetchTasks(),
      fetchPrompts(),
    ]);
    return {
      health:  health.status  === "fulfilled" ? health.value  : null,
      agents:  agents.status  === "fulfilled" ? agents.value  : [],
      tasks:   tasks.status   === "fulfilled" ? tasks.value   : [],
      prompts: prompts.status === "fulfilled" ? prompts.value : [],
    };
  } catch {
    return { health: null, agents: [], tasks: [], prompts: [] };
  }
}

export default async function Dashboard() {
  const { health, agents, tasks, prompts } = await getData();

  const runningAgents = agents.filter((a: { status: string }) => a.status === "running").length;
  const pendingTasks  = tasks.filter((t: { status: string }) => t.status === "pending").length;

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="text-sky-400 w-7 h-7" />
          <h1 className="text-2xl font-bold tracking-tight">AIOS Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span className={`w-2 h-2 rounded-full ${health ? "bg-emerald-400" : "bg-red-400"}`} />
          {health ? "Nexus-Core online" : "Nexus-Core nicht erreichbar"}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard icon={<Cpu className="w-5 h-5 text-sky-400" />}   label="Agents"          value={agents.length}    sub="registriert" />
        <KpiCard icon={<Zap className="w-5 h-5 text-yellow-400" />} label="Aktiv"           value={runningAgents}    sub="laufen gerade" />
        <KpiCard icon={<Clock className="w-5 h-5 text-purple-400" />} label="Tasks offen"   value={pendingTasks}     sub="pending" />
        <KpiCard icon={<Bot className="w-5 h-5 text-green-400" />}  label="Prompt-Registry" value={prompts.length}   sub="Agenten-YAMLs" />
      </div>

      {/* Service Links */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Plattform-Dienste</h2>
        <ServiceLinks />
      </section>

      {/* Agents */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Agents</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {agents.map((agent: { id: string; name: string; model: string; status: string }) => (
            <div key={agent.id} className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{agent.name}</span>
                <StatusBadge status={agent.status} />
              </div>
              <p className="text-xs text-slate-500 font-mono truncate">{agent.model}</p>
            </div>
          ))}
          {agents.length === 0 && <EmptyState text="Keine Agents — Nexus-Core erreichbar?" />}
        </div>
      </section>

      {/* Tasks */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Letzte Tasks</h2>
        <div className="bg-[#111827] border border-[#1f2937] rounded-xl overflow-hidden">
          {tasks.length === 0 ? (
            <EmptyState text="Noch keine Tasks erstellt" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1f2937] text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Titel</th>
                  <th className="text-left px-4 py-3">Agent</th>
                  <th className="text-left px-4 py-3">Priorität</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Erstellt</th>
                </tr>
              </thead>
              <tbody>
                {tasks.slice(-10).reverse().map((t: { id: string; title: string; agent_id: string; priority: string; status: string; created_at: string }) => (
                  <tr key={t.id} className="border-b border-[#1f2937] last:border-0 hover:bg-[#1a2332] transition-colors">
                    <td className="px-4 py-3 font-medium">{t.title}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{t.agent_id}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{new Date(t.created_at).toLocaleString("de-DE")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Prompt Registry */}
      {prompts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Prompt-Registry</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {prompts.map((p: { id: string; name: string; category: string; model: string; description: string }) => (
              <div key={p.id} className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{p.name}</span>
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">{p.category}</span>
                </div>
                <p className="text-xs text-slate-500 font-mono truncate">{p.model}</p>
                {p.description && <p className="text-xs text-slate-400">{p.description}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mac — Lokale Projekte & Docker */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Mac – Lokal</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MacProjectsWidget />
          <DockerControlWidget />
        </div>
      </section>

      {/* Infrastruktur — Cloudflare & Coolify */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Infrastruktur</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CloudflareWidget />
          <CoolifyWidget />
        </div>
      </section>

      {/* GitHub & Corporate LLM */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">GitHub & Prompts</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GitHubStatsWidget />
          <CorporatePromptWidget />
        </div>
      </section>

      <footer className="text-center text-xs text-slate-600 pt-4">
        AIOS · {health?.environment ?? "–"} · {health?.timestamp ? new Date(health.timestamp).toLocaleString("de-DE") : "–"}
      </footer>
    </div>
  );
}

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number; sub: string }) {
  return (
    <div className="bg-[#111827] border border-[#1f2937] rounded-xl p-4 flex items-center gap-4">
      <div className="p-2 rounded-lg bg-[#0a0f1a]">{icon}</div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-slate-400">{label} <span className="text-slate-600">· {sub}</span></p>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-slate-600 text-sm">
      <CheckCircle2 className="w-4 h-4 mr-2" /> {text}
    </div>
  );
}
