"use client";

import { useEffect, useState } from "react";
import type { MCPDienst } from "@/lib/mcp-plattform-data";

const statusColor: Record<MCPDienst["status"], string> = {
  aktiv:       "text-emerald-400 bg-emerald-400/10",
  onboarding:  "text-amber-400 bg-amber-400/10",
  inaktiv:     "text-slate-500 bg-slate-500/10",
};

const statusLabel: Record<MCPDienst["status"], string> = {
  aktiv:      "Aktiv",
  onboarding: "Onboarding",
  inaktiv:    "Inaktiv",
};

const PROJEKTE = [
  { id: "ai-agent-platform", label: "AI Agent Platform" },
  { id: "ai-voice-platform", label: "AI Voice Platform" },
  { id: "infrastruktur",     label: "Infrastruktur" },
];

export function MCPDienstePanel() {
  const [liste, setListe] = useState<MCPDienst[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", funktion: "", dienstEmoji: "⚙️", projekt: "infrastruktur" });

  useEffect(() => {
    fetch("/api/mcp-plattform/dienste")
      .then((r) => r.json())
      .then((d) => { setListe(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!form.name || !form.funktion) return;
    const res = await fetch("/api/mcp-plattform/dienste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const d = await res.json();
      setListe((prev) => [...prev, d]);
      setForm({ name: "", funktion: "", dienstEmoji: "⚙️", projekt: "infrastruktur" });
      setAdding(false);
    }
  }

  function reliabilityBar(level: number) {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-2.5 rounded-sm ${i < level ? "bg-[var(--accent-blue)]" : "bg-[var(--border-bright)]"}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <span className="text-base">⚙️</span>
          <span className="text-sm font-semibold">MCP-Dienste</span>
          <span className="ml-1 text-xs text-slate-500 bg-[var(--layer-0)] px-2 py-0.5 rounded-full">
            {liste.filter((d) => d.status === "aktiv").length} aktiv
          </span>
        </div>
        <button
          onClick={() => setAdding((v) => !v)}
          className="btn-primary text-xs py-1 px-3"
        >
          {adding ? "Abbrechen" : "+ Hinzufügen"}
        </button>
      </div>

      {adding && (
        <div className="p-4 border-b border-[var(--border-bright)] bg-[var(--layer-0)] space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Name (z.B. MCP GitHub)"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="bg-[var(--layer-1)] border border-[var(--border-bright)] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[var(--accent-blue)]/60"
            />
            <input
              placeholder="Funktion (z.B. Versionskontrolle)"
              value={form.funktion}
              onChange={(e) => setForm((f) => ({ ...f, funktion: e.target.value }))}
              className="bg-[var(--layer-1)] border border-[var(--border-bright)] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[var(--accent-blue)]/60"
            />
            <select
              value={form.projekt}
              onChange={(e) => setForm((f) => ({ ...f, projekt: e.target.value }))}
              className="bg-[var(--layer-1)] border border-[var(--border-bright)] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[var(--accent-blue)]/60"
            >
              {PROJEKTE.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
            <select
              value={form.dienstEmoji}
              onChange={(e) => setForm((f) => ({ ...f, dienstEmoji: e.target.value }))}
              className="bg-[var(--layer-1)] border border-[var(--border-bright)] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[var(--accent-blue)]/60"
            >
              <option value="⚙️">⚙️ Service</option>
              <option value="🐙">🐙 GitHub</option>
              <option value="🐘">🐘 Postgres</option>
              <option value="🔮">🔮 Vector DB</option>
              <option value="📁">📁 Filesystem</option>
              <option value="🔍">🔍 Search/AI</option>
              <option value="🚀">🚀 Deployment</option>
              <option value="🖥️">🖥️ Server</option>
              <option value="🔐">🔐 Auth/SSO</option>
              <option value="📊">📊 Monitoring</option>
              <option value="⚡">⚡ Automation</option>
              <option value="☁️">☁️ Cloud/CDN</option>
            </select>
          </div>
          <button onClick={handleAdd} className="btn-primary w-full text-xs py-2">
            MCP-Dienst anlegen
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-6 text-center text-slate-600 text-sm">Lädt…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs corp-table">
            <thead>
              <tr>
                <th className="text-left px-4 py-3">Dienst</th>
                <th className="text-left px-4 py-3">Projekt</th>
                <th className="text-left px-4 py-3">Zuverlässigkeit</th>
                <th className="text-left px-4 py-3">Health</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((d) => (
                <tr key={d.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{d.dienstEmoji}</span>
                      <div>
                        {d.url ? (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-slate-200 hover:text-[var(--accent-blue)] transition-colors"
                          >
                            {d.name}
                          </a>
                        ) : (
                          <p className="font-medium text-slate-200">{d.name}</p>
                        )}
                        <p className="text-slate-600">{d.funktion}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {PROJEKTE.find((p) => p.id === d.projekt)?.label ?? d.projekt}
                  </td>
                  <td className="px-4 py-3 space-y-1">
                    {reliabilityBar(d.zuverlaessigkeit)}
                    <span className="text-slate-600">{d.zuverlaessigkeit}/7</span>
                  </td>
                  <td className="px-4 py-3">
                    {d.healthScore > 0 ? (
                      <span className={d.healthScore >= 90 ? "text-emerald-400" : d.healthScore >= 70 ? "text-amber-400" : "text-red-400"}>
                        {d.healthScore}%
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[d.status]}`}>
                      {statusLabel[d.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
