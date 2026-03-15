"use client";

import { useEffect, useState } from "react";
import type { Mitarbeiter } from "@/lib/mcp-stadt-data";

const statusColor: Record<Mitarbeiter["status"], string> = {
  aktiv:       "text-emerald-400 bg-emerald-400/10",
  onboarding:  "text-amber-400 bg-amber-400/10",
  inaktiv:     "text-slate-500 bg-slate-500/10",
};

const statusLabel: Record<Mitarbeiter["status"], string> = {
  aktiv:      "Aktiv",
  onboarding: "Onboarding",
  inaktiv:    "Inaktiv",
};

export function MitarbeiterPanel() {
  const [liste, setListe] = useState<Mitarbeiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", rolle: "", rolleEmoji: "🔧", bezirk: "" });

  useEffect(() => {
    fetch("/api/mcp-stadt/mitarbeiter")
      .then((r) => r.json())
      .then((d) => { setListe(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!form.name || !form.rolle) return;
    const res = await fetch("/api/mcp-stadt/mitarbeiter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const m = await res.json();
      setListe((prev) => [...prev, m]);
      setForm({ name: "", rolle: "", rolleEmoji: "🔧", bezirk: "" });
      setAdding(false);
    }
  }

  function levelBar(level: number) {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-2.5 rounded-sm ${i < level ? "bg-[#1d6ef5]" : "bg-[#1a2540]"}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <span className="text-base">👥</span>
          <span className="text-sm font-semibold">Mitarbeiter</span>
          <span className="ml-1 text-xs text-slate-500 bg-[#0a0f1a] px-2 py-0.5 rounded-full">
            {liste.filter((m) => m.status === "aktiv").length} aktiv
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
        <div className="p-4 border-b border-[#1a2540] bg-[#070b14] space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="bg-[#0d1321] border border-[#1a2540] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#1d6ef5]/60"
            />
            <input
              placeholder="Rolle (z.B. Entwickler)"
              value={form.rolle}
              onChange={(e) => setForm((f) => ({ ...f, rolle: e.target.value }))}
              className="bg-[#0d1321] border border-[#1a2540] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#1d6ef5]/60"
            />
            <input
              placeholder="Bezirk"
              value={form.bezirk}
              onChange={(e) => setForm((f) => ({ ...f, bezirk: e.target.value }))}
              className="bg-[#0d1321] border border-[#1a2540] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#1d6ef5]/60"
            />
            <select
              value={form.rolleEmoji}
              onChange={(e) => setForm((f) => ({ ...f, rolleEmoji: e.target.value }))}
              className="bg-[#0d1321] border border-[#1a2540] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#1d6ef5]/60"
            >
              <option value="🏛️">🏛️ Bürgermeister</option>
              <option value="👔">👔 Projektleiter</option>
              <option value="🛡️">🛡️ Security-Lead</option>
              <option value="🔬">🔬 Tech-Lead</option>
              <option value="🔧">🔧 Entwickler</option>
              <option value="👷">👷 Operator</option>
            </select>
          </div>
          <button onClick={handleAdd} className="btn-primary w-full text-xs py-2">
            Mitarbeiter anlegen
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
                <th className="text-left px-4 py-3">Mitarbeiter</th>
                <th className="text-left px-4 py-3">Bezirk</th>
                <th className="text-left px-4 py-3">Halluc-Level</th>
                <th className="text-left px-4 py-3">Score</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {liste.map((m) => (
                <tr key={m.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{m.rolleEmoji}</span>
                      <div>
                        <p className="font-medium text-slate-200">{m.name}</p>
                        <p className="text-slate-600">{m.rolle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{m.bezirk}</td>
                  <td className="px-4 py-3 space-y-1">
                    {levelBar(m.hallucLevel)}
                    <span className="text-slate-600">Level {m.hallucLevel}/7</span>
                  </td>
                  <td className="px-4 py-3">
                    {m.hallucScore > 0 ? (
                      <span className={m.hallucScore >= 90 ? "text-emerald-400" : m.hallucScore >= 80 ? "text-amber-400" : "text-red-400"}>
                        {m.hallucScore}%
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor[m.status]}`}>
                      {statusLabel[m.status]}
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
