"use client";

import { useEffect, useState } from "react";
import type { Bezirk, BezirkStatus } from "@/lib/mcp-stadt-data";

const statusColor: Record<BezirkStatus, string> = {
  online:   "bg-emerald-500",
  degraded: "bg-amber-400",
  offline:  "bg-red-500",
};

const statusLabel: Record<BezirkStatus, string> = {
  online:   "Online",
  degraded: "Degraded",
  offline:  "Offline",
};

export function BezirkeGrid() {
  const [bezirke, setBezirke] = useState<Bezirk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mcp-stadt/bezirke")
      .then((r) => r.json())
      .then((d) => { setBezirke(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card h-44 animate-pulse bg-[#0d1321]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {bezirke.map((b) => (
        <div key={b.id} className="card p-5 space-y-3 hover:border-[#1d6ef5]/40 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{b.emoji}</span>
              <div>
                <p className="font-semibold text-sm leading-tight">{b.name}</p>
                {b.leiterin && (
                  <p className="text-xs text-slate-500 mt-0.5">{b.leiterin}</p>
                )}
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor[b.status]} live-dot`} />
              <span className={b.status === "online" ? "text-emerald-400" : b.status === "degraded" ? "text-amber-400" : "text-red-400"}>
                {statusLabel[b.status]}
              </span>
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">{b.beschreibung}</p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <Stat label="Uptime" value={`${b.uptime_pct}%`} color={b.uptime_pct > 99 ? "text-emerald-400" : b.uptime_pct > 97 ? "text-amber-400" : "text-red-400"} />
            <Stat label="Tasks/h" value={String(b.tasks_heute)} color="text-sky-400" />
            <Stat label="Fehler" value={String(b.fehler_heute)} color={b.fehler_heute === 0 ? "text-slate-500" : "text-red-400"} />
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {b.tools.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-[#0a0f1a] border border-[#1a2540] text-slate-500 font-mono">
                {t}
              </span>
            ))}
            {b.tools.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0a0f1a] border border-[#1a2540] text-slate-600">
                +{b.tools.length - 3}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-[#070b14] rounded-lg p-2 text-center">
      <p className={`text-sm font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-600 mt-0.5">{label}</p>
    </div>
  );
}
