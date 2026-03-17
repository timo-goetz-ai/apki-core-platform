'use client';

import { ExternalLink, Bell } from 'lucide-react';

export default function AlertsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1.5 flex items-center gap-2.5">
          <span className="text-2xl">🚨</span> Alerts
        </h1>
        <p className="text-sm text-slate-400">Alertmanager — Benachrichtigungen und Incidents</p>
      </div>

      <div className="grid gap-4 max-w-2xl">
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <Bell size={18} className="text-red-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 mb-1">Prometheus Alertmanager</p>
            <p className="text-sm text-slate-400 mb-3 leading-relaxed">
              Verwaltung von Alerts, Routing-Regeln und Benachrichtigungskanälen.
            </p>
            <a
              href="https://alertmanager.automation-plus-ki.de"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors text-sm font-medium no-underline"
            >
              Alertmanager öffnen
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
            <Bell size={18} className="text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-100 mb-1">Grafana Alerts</p>
            <p className="text-sm text-slate-400 mb-3 leading-relaxed">
              Alert-Rules und Benachrichtigungen direkt in Grafana konfigurieren.
            </p>
            <a
              href="https://grafana.automation-plus-ki.de/alerting"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-colors text-sm font-medium no-underline"
            >
              Grafana Alerting öffnen
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
