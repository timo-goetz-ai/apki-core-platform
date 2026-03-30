import { FolderBrowser } from "@/components/FolderBrowser";

export default function DashboardsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">🖥️ Monitoring — Dashboards</h1>
        <p className="text-xs text-slate-500 mt-1">05_Dashboards — Grafana, Prometheus & Custom Views</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FolderBrowser category="dashboards" title="05_Dashboards" icon="🖥️" />
        <div className="card p-5 space-y-4">
          <p className="text-xs font-semibold text-slate-300">📊 Live-Monitoring</p>
          {[
            { label: "Grafana", url: "https://grafana.automation-plus-ki.de", icon: "📈", desc: "Metriken & Dashboards" },
            { label: "Prometheus", url: "https://prometheus.automation-plus-ki.de", icon: "🔥", desc: "Metriken & Alerting" },
            { label: "MCP Grafana", url: "https://mcp-grafana.automation-plus-ki.de", icon: "🔌", desc: "MCP-Server" },
            { label: "MCP Prometheus", url: "https://mcp-prometheus.automation-plus-ki.de", icon: "🔌", desc: "MCP-Server" },
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
                <p className="text-[10px] text-slate-600">{s.desc}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
