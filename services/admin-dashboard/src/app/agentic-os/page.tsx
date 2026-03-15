"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FsEntry } from "../api/agentic-os/[category]/route";

type CategoryStat = {
  label: string;
  icon: string;
  category: string;
  href: string;
  color: string;
  count: number | null;
};

const STATS: CategoryStat[] = [
  { label: "Active Projects", icon: "📂", category: "active-projects", href: "/agentic-os/management/active-projects", color: "text-sky-400", count: null },
  { label: "Agents",          icon: "🤖", category: "agents",           href: "/agentic-os/engine-room/agents",         color: "text-amber-400", count: null },
  { label: "Prompts",         icon: "✍️", category: "prompts",          href: "/agentic-os/knowledge/prompts",          color: "text-emerald-400", count: null },
  { label: "Templates",       icon: "📋", category: "templates",        href: "/agentic-os/knowledge/templates",        color: "text-purple-400", count: null },
  { label: "Workflows",       icon: "⚡", category: "workflows",         href: "/agentic-os/engine-room/workflows",      color: "text-rose-400", count: null },
  { label: "Automations",     icon: "🔄", category: "automations",       href: "/agentic-os/monitoring/automations",     color: "text-indigo-400", count: null },
];

const QUICK_LINKS = [
  { label: "Crew starten", href: "/agentic-os/engine-room/agents", icon: "🚀" },
  { label: "Prompt wählen", href: "/agentic-os/knowledge/prompts", icon: "✍️" },
  { label: "Workflow", href: "/agentic-os/engine-room/workflows", icon: "⚡" },
  { label: "MCP-Plattform", href: "/mcp-plattform", icon: "⚙️" },
];

export default function AgenticOSCockpit() {
  const [stats, setStats] = useState<CategoryStat[]>(STATS);
  const [activeProjects, setActiveProjects] = useState<FsEntry[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    // Lade Zähler für alle Kategorien parallel
    Promise.all(
      STATS.map((s) =>
        fetch(`/api/agentic-os/${s.category}`)
          .then((r) => r.json())
          .then((d) => ({ ...s, count: d.total ?? 0 }))
          .catch(() => ({ ...s, count: 0 }))
      )
    ).then(setStats);

    // Lade Active Projects für den Context-Bereich
    fetch("/api/agentic-os/active-projects")
      .then((r) => r.json())
      .then((d) => {
        setActiveProjects(d.entries ?? []);
        setConfigured(d.configured ?? false);
      })
      .catch(() => setConfigured(false));
  }, []);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">🗺️ Agentic OS Cockpit</h1>
        <p className="text-xs text-slate-500 mt-1">
          Dateisystem als Single Source of Truth · 03_ai-agent-platform
        </p>
      </div>

      {/* Konfigurationshinweis wenn Pfad nicht gesetzt */}
      {configured === false && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <p className="text-xs font-semibold text-amber-400 mb-1">⚠️ AGENTIC_OS_BASE_PATH nicht konfiguriert</p>
          <p className="text-xs text-slate-400">
            Setze die Env-Variable in Coolify:
          </p>
          <code className="text-xs font-mono text-slate-300 block mt-1">
            AGENTIC_OS_BASE_PATH=/pfad/zu/03_ai-agent-platform
          </code>
          <p className="text-[10px] text-slate-500 mt-1">
            Lokal Mac: ~/Geschäft/STUDIO/03_AI_Engineering/07_Projects/03_ai-agent-platform
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        {QUICK_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#111827] border border-[#1a2540] text-xs text-slate-300 hover:border-[#1d6ef5]/40 hover:text-slate-100 transition-colors"
          >
            <span>{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => (
          <Link
            key={s.category}
            href={s.href}
            className="card p-4 text-center space-y-2 hover:border-[#1d6ef5]/40 transition-colors group"
          >
            <span className="text-xl">{s.icon}</span>
            <p className={`text-2xl font-bold ${s.color}`}>
              {s.count === null ? "…" : s.count}
            </p>
            <p className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors leading-tight">
              {s.label}
            </p>
          </Link>
        ))}
      </div>

      {/* Active Context — 02_Active_Projects */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
            📂 Active Context — 02_Active_Projects
          </h2>
          <Link href="/agentic-os/management/active-projects" className="text-[10px] text-[#1d6ef5]/70 hover:text-[#1d6ef5]">
            Alle anzeigen →
          </Link>
        </div>
        {activeProjects.length === 0 ? (
          <div className="card p-6 text-center text-slate-600 text-sm">
            {configured === false ? "Pfad konfigurieren um Projekte zu sehen" : "Keine aktiven Projekte gefunden"}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeProjects.slice(0, 6).map((entry) => (
              <div key={entry.name} className="card p-4 space-y-2 hover:border-[#1d6ef5]/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-base">{entry.type === "directory" ? "📁" : "📄"}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{entry.displayName}</p>
                    <p className="text-[10px] font-mono text-slate-600 truncate">{entry.name}</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-600">
                  {new Date(entry.modified).toLocaleDateString("de-DE")}
                  {entry.type === "file" && ` · ${(entry.size / 1024).toFixed(1)} KB`}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* OS-Struktur Übersicht */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Folder-Struktur — Agentic OS
        </h2>
        <div className="card p-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {OS_STRUCTURE.map((cat) => (
              <div key={cat.label}>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${cat.color}`}>
                  {cat.icon} {cat.label}
                </p>
                <div className="space-y-1">
                  {cat.folders.map((f) => (
                    <div key={f.id} className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-700 font-mono w-6">{f.id}</span>
                      <span className="text-[10px] text-slate-500">{f.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

const OS_STRUCTURE = [
  {
    label: "Management",
    icon: "🎯",
    color: "text-sky-400",
    folders: [
      { id: "01", name: "AI_Ops" },
      { id: "02", name: "Active_Projects" },
    ],
  },
  {
    label: "Engine Room",
    icon: "🔧",
    color: "text-amber-400",
    folders: [
      { id: "03", name: "Agents" },
      { id: "10", name: "Workflows" },
    ],
  },
  {
    label: "Knowledge",
    icon: "📚",
    color: "text-emerald-400",
    folders: [
      { id: "07", name: "Prompt_Library" },
      { id: "08", name: "Templates" },
    ],
  },
  {
    label: "Monitoring",
    icon: "📊",
    color: "text-purple-400",
    folders: [
      { id: "04", name: "Automations" },
      { id: "05", name: "Dashboards" },
    ],
  },
];
