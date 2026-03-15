"use client";

import { useEffect, useState } from "react";
import type { AuditEintrag } from "@/lib/mcp-plattform-data";

const ergebnisStyle: Record<AuditEintrag["ergebnis"], string> = {
  OK:     "text-emerald-400 bg-emerald-400/10",
  WARN:   "text-amber-400 bg-amber-400/10",
  FEHLER: "text-red-400 bg-red-400/10",
};

const aktionIcon: Record<string, string> = {
  deploy_service:      "🚀",
  config_change:       "⚙️",
  health_check:        "🩺",
  permission_grant:    "🔑",
  permission_revoke:   "🚫",
  service_onboard:     "✨",
  service_offboard:    "📦",
  incident:            "🚨",
  rollback:            "↩️",
  scaling:             "📈",
  // Legacy-Kompatibilität
  deploy_template:     "🚀",
  hallucination_test:  "🧪",
  bezirk_error:        "⚠️",
  mitarbeiter_onboard: "👋",
  mitarbeiter_created: "✨",
  mitarbeiter_offboard:"📦",
  manual:              "📌",
};

export function AuditTimeline() {
  const [eintraege, setEintraege] = useState<AuditEintrag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mcp-plattform/audit")
      .then((r) => r.json())
      .then((d) => { setEintraege(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-sm font-semibold">Audit-Trail</span>
        </div>
        <span className="text-xs text-slate-600">{eintraege.length} Einträge</span>
      </div>

      {loading ? (
        <div className="p-6 text-center text-slate-600 text-sm">Lädt…</div>
      ) : (
        <div className="divide-y divide-[#0f1a2e] max-h-[420px] overflow-y-auto">
          {eintraege.map((e) => (
            <div key={e.id} className="px-4 py-3 hover:bg-white/[0.01] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="text-sm mt-0.5 shrink-0">
                    {aktionIcon[e.aktion] ?? "📌"}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs text-slate-300">{e.aktion}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ergebnisStyle[e.ergebnis]}`}>
                        {e.ergebnis}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      <span className="text-slate-400">{e.akteur}</span>
                      {" · "}
                      <span className="font-mono">{e.ressource}</span>
                    </p>
                    {e.details && (
                      <p className="text-xs text-slate-600 mt-0.5">{e.details}</p>
                    )}
                  </div>
                </div>
                <time className="text-[10px] text-slate-600 shrink-0 pt-0.5">
                  {new Date(e.ts).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
