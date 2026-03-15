"use client";

import { useEffect, useState, useCallback } from "react";
import { GitBranch, Package, Clock, RefreshCw, ExternalLink, AlertCircle, HardDrive, Folder } from "lucide-react";
import type { MacProject } from "@/lib/mac-store";

interface MacData {
  lastSync: string | null;
  host: string | null;
  count: number;
  projects: MacProject[];
}

const activityColors: Record<string, string> = {
  active:   "bg-emerald-500",
  recent:   "bg-blue-400",
  slow:     "bg-amber-400",
  archived: "bg-zinc-600",
  unknown:  "bg-zinc-700",
};

const activityLabels: Record<string, string> = {
  active:   "Aktiv",
  recent:   "Kürzlich",
  slow:     "Langsam",
  archived: "Archiviert",
  unknown:  "Unbekannt",
};

const typeIcons: Record<string, string> = {
  node:   "⬡",
  python: "🐍",
  go:     "🐹",
  rust:   "⚙",
  ruby:   "💎",
  java:   "☕",
  dotnet: "🔷",
  php:    "🐘",
  other:  "📦",
};

function relTime(iso: string | null): string {
  if (!iso) return "–";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `vor ${diff}s`;
  if (diff < 3600)  return `vor ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`;
  return `vor ${Math.floor(diff / 86400)}d`;
}

export function MacProjectsWidget() {
  const [data, setData] = useState<MacData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<MacProject | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY ?? "";

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/mac/projects", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      setData(await res.json());
    } catch {
      // keep previous data
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 60_000);
    return () => clearInterval(iv);
  }, [load]);

  const projects = data?.projects ?? [];
  const filtered = filter === "all" ? projects : projects.filter(p => p.activity === filter);

  const counts = {
    all:      projects.length,
    active:   projects.filter(p => p.activity === "active").length,
    recent:   projects.filter(p => p.activity === "recent").length,
    slow:     projects.filter(p => p.activity === "slow").length,
    archived: projects.filter(p => p.activity === "archived").length,
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
         className="rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
           style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <HardDrive className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-white">Mac Projekte</h2>
          {data?.host && (
            <span className="text-xs px-2 py-0.5 rounded"
                  style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
              {data.host}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {data?.lastSync && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Sync {relTime(data.lastSync)}
            </span>
          )}
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 px-5 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filter === key
                ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
            }`}
          >
            {key === "all" ? "Alle" : activityLabels[key]} ({count})
          </button>
        ))}
      </div>

      {/* Project List */}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {loading && !projects.length ? (
          <div className="px-5 py-10 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Lade Projekte…
          </div>
        ) : !data?.lastSync ? (
          <div className="px-5 py-10 text-center">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-amber-300 font-medium mb-1">Noch kein Scan empfangen</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Führe auf deinem Mac aus:<br />
              <code className="text-blue-400">node tools/mac-scanner/scan.js --push</code>
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Keine Projekte in dieser Kategorie
          </div>
        ) : (
          filtered.map(project => (
            <div
              key={project.id}
              onClick={() => setSelected(selected?.id === project.id ? null : project)}
              className="px-5 py-3.5 hover:bg-white/3 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base flex-shrink-0">{typeIcons[project.type] ?? "📦"}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-white truncate">{project.name}</span>
                      {project.docker.hasDockerfile && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 flex-shrink-0">
                          Docker
                        </span>
                      )}
                      {project.git?.isDirty && (
                        <span className="text-xs text-amber-400 flex-shrink-0">●</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      {project.git?.branch && (
                        <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                          <GitBranch className="w-3 h-3" />
                          {project.git.branch}
                          {(project.git.ahead > 0 || project.git.behind > 0) && (
                            <span className="text-amber-400">
                              {project.git.ahead > 0 ? `↑${project.git.ahead}` : ""}
                              {project.git.behind > 0 ? `↓${project.git.behind}` : ""}
                            </span>
                          )}
                        </span>
                      )}
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {relTime(project.git?.lastCommitDate ?? project.lastModified)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`w-2 h-2 rounded-full ${activityColors[project.activity]}`} />
                  {project.git?.remote && (
                    <a
                      href={project.git.remote}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="text-zinc-600 hover:text-zinc-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Expanded detail */}
              {selected?.id === project.id && (
                <div className="mt-3 pt-3 border-t space-y-2" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Folder className="w-3 h-3" />
                    <code className="truncate">{project.path}</code>
                  </div>
                  {project.git?.lastCommitMsg && (
                    <div className="flex items-start gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Package className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span className="italic">{project.git.lastCommitMsg}</span>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="p-2 rounded-lg text-center" style={{ background: "var(--bg)" }}>
                      <div className="text-xs font-medium text-white">{project.type}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Typ</div>
                    </div>
                    <div className="p-2 rounded-lg text-center" style={{ background: "var(--bg)" }}>
                      <div className="text-xs font-medium text-white">
                        {activityLabels[project.activity]}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Status</div>
                    </div>
                    <div className="p-2 rounded-lg text-center" style={{ background: "var(--bg)" }}>
                      <div className="text-xs font-medium text-white">
                        {project.docker.hasDockerfile ? "Ja" : "Nein"}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Dockerfile</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer stats */}
      {projects.length > 0 && (
        <div className="px-5 py-3 border-t flex gap-4" style={{ borderColor: "var(--border)" }}>
          {Object.entries(counts).filter(([k]) => k !== "all").map(([key, count]) => (
            count > 0 ? (
              <div key={key} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${activityColors[key]}`} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{count} {activityLabels[key]}</span>
              </div>
            ) : null
          ))}
        </div>
      )}
    </div>
  );
}
