import { FolderBrowser } from "@/components/FolderBrowser";

export default function AutomationsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">🔄 Monitoring — Automations</h1>
        <p className="text-xs text-slate-500 mt-1">04_Automations — n8n Workflows & Scheduled Jobs</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FolderBrowser category="automations" title="04_Automations" icon="🔄" />
        <div className="card p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-300">🔗 Externe Automation-Services</p>
          {[
            { label: "n8n Workflows", url: "https://n8n.automation-plus-ki.de", icon: "⚡" },
            { label: "Grafana Alerts", url: "https://grafana.automation-plus-ki.de/alerting", icon: "🔔" },
            { label: "Prometheus Rules", url: "https://prometheus.automation-plus-ki.de/rules", icon: "📏" },
            { label: "Coolify Deployments", url: "https://coolify.automation-plus-ki.de", icon: "🚀" },
          ].map((s) => (
            <a
              key={s.url}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-[var(--layer-0)] border border-[var(--border)] hover:border-[var(--accent-blue)]/30 transition-colors group"
            >
              <span className="text-base">{s.icon}</span>
              <div>
                <p className="text-xs font-medium text-slate-300 group-hover:text-slate-100">{s.label}</p>
                <p className="text-[10px] font-mono text-slate-600 truncate">{s.url.replace("https://", "")}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
