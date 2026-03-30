"use client";

import { useEffect, useState } from "react";
import type { Projekt, ProjektStatus } from "@/lib/mcp-plattform-data";

const statusColor: Record<ProjektStatus, string> = {
  online:   "bg-emerald-500",
  degraded: "bg-amber-400",
  offline:  "bg-red-500",
};

const statusLabel: Record<ProjektStatus, string> = {
  online:   "Online",
  degraded: "Degraded",
  offline:  "Offline",
};

export function ProjekteGrid() {
  const [projekte, setProjekte] = useState<Projekt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mcp-plattform/projekte")
      .then((r) => r.json())
      .then((d) => { setProjekte(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card h-52 animate-pulse bg-[var(--layer-1)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {projekte.map((p) => (
        <div key={p.id} className="card p-5 space-y-3 hover:border-[var(--accent-blue)]/40 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{p.emoji}</span>
              <div>
                <p className="font-semibold text-sm leading-tight">{p.name}</p>
                {p.owner && (
                  <p className="text-xs text-slate-500 mt-0.5">{p.owner}</p>
                )}
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-xs font-medium">
              <span className={`w-1.5 h-1.5 rounded-full ${statusColor[p.status]} live-dot`} />
              <span className={p.status === "online" ? "text-emerald-400" : p.status === "degraded" ? "text-amber-400" : "text-red-400"}>
                {statusLabel[p.status]}
              </span>
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">{p.beschreibung}</p>

          {p.url && (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-[var(--accent-blue)]/70 hover:text-[var(--accent-blue)] transition-colors truncate block"
            >
              {p.url.replace("https://", "")}
            </a>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1">
            <Stat label="Uptime" value={`${p.uptime_pct}%`} color={p.uptime_pct > 99 ? "text-emerald-400" : p.uptime_pct > 97 ? "text-amber-400" : "text-red-400"} />
            <Stat label="Requests" value={String(p.requests_heute)} color="text-sky-400" />
            <Stat label="Fehler" value={String(p.fehler_heute)} color={p.fehler_heute === 0 ? "text-slate-500" : "text-red-400"} />
          </div>

          <div className="flex flex-wrap gap-1 pt-1">
            {p.mcpServer.slice(0, 4).map((s) => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--layer-0)] border border-[var(--border-bright)] text-slate-500 font-mono">
                {s}
              </span>
            ))}
            {p.mcpServer.length > 4 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--layer-0)] border border-[var(--border-bright)] text-slate-600">
                +{p.mcpServer.length - 4}
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
    <div className="bg-[var(--layer-0)] rounded-lg p-2 text-center">
      <p className={`text-sm font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-slate-600 mt-0.5">{label}</p>
    </div>
  );
}
