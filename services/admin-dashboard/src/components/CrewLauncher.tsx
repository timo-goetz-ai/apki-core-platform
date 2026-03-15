"use client";

import { useEffect, useState } from "react";

type Crew = {
  id: string;
  name: string;
  agents: number;
  tasks: number;
};

type FsFile = {
  name: string;
  displayName: string;
  path: string;
  ext: string;
};

type Props = {
  onExecutionStart: (executionId: string) => void;
  initialPromptPath?: string;   // aus URL-Param übergeben
};

export function CrewLauncher({ onExecutionStart, initialPromptPath }: Props) {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrew, setSelectedCrew] = useState<string>("");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [starting, setStarting] = useState(false);

  // Prompt Injection
  const [prompts, setPrompts] = useState<FsFile[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>(initialPromptPath ?? "");
  const [promptContent, setPromptContent] = useState<string>("");
  const [promptsConfigured, setPromptsConfigured] = useState(true);

  // Template Dropdown
  const [templates, setTemplates] = useState<FsFile[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  useEffect(() => {
    // Crews laden
    fetch("/api/crews/")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setCrews(list);
        setSelectedCrew((prev) => (prev || (list[0]?.id ?? "")));
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Prompts laden
    fetch("/api/agentic-os/prompts")
      .then((r) => r.json())
      .then((d) => {
        const mdFiles = (d.entries ?? []).filter((e: FsFile) => e.ext === ".md" || e.ext === ".txt");
        setPrompts(mdFiles);
        setPromptsConfigured(d.configured !== false);
      })
      .catch(() => {});

    // Templates laden
    fetch("/api/agentic-os/templates")
      .then((r) => r.json())
      .then((d) => {
        const files = (d.entries ?? []).filter((e: FsFile) => e.ext === ".md" || e.ext === ".txt" || e.ext === ".json");
        setTemplates(files);
      })
      .catch(() => {});
  }, []);

  // Prompt-Inhalt laden wenn Auswahl sich ändert
  useEffect(() => {
    if (!selectedPrompt) { setPromptContent(""); return; }
    fetch(`/api/agentic-os/file?path=${encodeURIComponent(selectedPrompt)}`)
      .then((r) => r.json())
      .then((d) => setPromptContent(d.content ?? ""))
      .catch(() => setPromptContent(""));
  }, [selectedPrompt]);

  const startCrew = async () => {
    if (!selectedCrew) return;
    setStarting(true);
    try {
      const payload: Record<string, string> = { ...inputs };
      if (promptContent) payload.system_prompt = promptContent;
      if (selectedTemplate) payload.template = selectedTemplate;

      const r = await fetch(`/api/crews/${selectedCrew}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json();
      if (data?.execution_id) onExecutionStart(data.execution_id);
    } catch (e) {
      console.error("Start crew failed:", e);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="card p-4 text-slate-500 text-sm animate-pulse">Lade Crews…</div>
    );
  }

  return (
    <div className="card space-y-0">
      <div className="card-header">
        <div className="flex items-center gap-2">
          <span className="text-base">🚀</span>
          <span className="text-sm font-semibold">Crew starten</span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Crew Auswahl */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Crew</label>
          <select
            value={selectedCrew}
            onChange={(e) => setSelectedCrew(e.target.value)}
            className="w-full bg-[#070b14] border border-[#1a2540] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#1d6ef5]/60"
          >
            <option value="">— Auswählen —</option>
            {crews.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.agents} Agents, {c.tasks} Tasks)
              </option>
            ))}
          </select>
        </div>

        {/* Topic Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400">Topic / Input</label>
          <input
            type="text"
            placeholder="z.B. KI-Management, Lead-Generierung…"
            value={inputs.topic ?? ""}
            onChange={(e) => setInputs((p) => ({ ...p, topic: e.target.value }))}
            className="w-full bg-[#070b14] border border-[#1a2540] rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#1d6ef5]/60"
          />
        </div>

        {/* Dynamic Prompt Injection — 07_Prompt_Library */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
            ✍️ Prompt Injection
            <span className="text-[10px] text-slate-600 font-normal">07_Prompt_Library</span>
            {!promptsConfigured && (
              <span className="text-[10px] text-amber-500">⚠️ Pfad nicht konfiguriert</span>
            )}
          </label>
          <select
            value={selectedPrompt}
            onChange={(e) => setSelectedPrompt(e.target.value)}
            className="w-full bg-[#070b14] border border-[#1a2540] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#1d6ef5]/60"
          >
            <option value="">— Kein Prompt —</option>
            {prompts.map((p) => (
              <option key={p.path} value={p.path}>{p.displayName}</option>
            ))}
          </select>
          {promptContent && (
            <div className="bg-[#070b14] border border-emerald-500/20 rounded-lg p-3">
              <p className="text-[10px] text-emerald-400 font-semibold mb-1">✅ Injiziert</p>
              <p className="text-[10px] text-slate-500 line-clamp-3 font-mono leading-relaxed">
                {promptContent.slice(0, 280)}{promptContent.length > 280 ? "…" : ""}
              </p>
            </div>
          )}
        </div>

        {/* Template Dropdown — 08_Templates */}
        {templates.length > 0 && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              📋 Template
              <span className="text-[10px] text-slate-600 font-normal">08_Templates</span>
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full bg-[#070b14] border border-[#1a2540] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-[#1d6ef5]/60"
            >
              <option value="">— Kein Template —</option>
              {templates.map((t) => (
                <option key={t.path} value={t.path}>{t.displayName}</option>
              ))}
            </select>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={startCrew}
          disabled={!selectedCrew || starting}
          className="btn-primary w-full py-2 text-sm disabled:opacity-40"
        >
          {starting ? "Starte Crew…" : "🚀 Crew starten"}
        </button>
      </div>
    </div>
  );
}
