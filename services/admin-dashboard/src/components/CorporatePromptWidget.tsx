"use client";

import { useEffect, useState, useCallback } from "react";
import { Brain, Plus, Copy, Pin, Trash2, RefreshCw, ChevronDown, ChevronUp, Check } from "lucide-react";
import type { CorporatePrompt, PromptCategory } from "@/lib/prompt-store";

const CATEGORIES: { value: PromptCategory | "all"; label: string; color: string }[] = [
  { value: "all",      label: "Alle",       color: "text-white" },
  { value: "system",   label: "System",     color: "text-sky-400" },
  { value: "coding",   label: "Coding",     color: "text-green-400" },
  { value: "ops",      label: "Ops",        color: "text-orange-400" },
  { value: "analysis", label: "Analyse",    color: "text-purple-400" },
  { value: "writing",  label: "Writing",    color: "text-pink-400" },
  { value: "custom",   label: "Custom",     color: "text-zinc-400" },
];

const CAT_BADGE: Record<PromptCategory, string> = {
  system:   "bg-sky-500/10 text-sky-400",
  coding:   "bg-green-500/10 text-green-400",
  ops:      "bg-orange-500/10 text-orange-400",
  analysis: "bg-purple-500/10 text-purple-400",
  writing:  "bg-pink-500/10 text-pink-400",
  customer: "bg-yellow-500/10 text-yellow-400",
  custom:   "bg-zinc-500/10 text-zinc-400",
};

const DEFAULT_MODELS = [
  "claude-opus-4-6",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
];

export function CorporatePromptWidget() {
  const [prompts, setPrompts]   = useState<CorporatePrompt[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<PromptCategory | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [copied, setCopied]     = useState<string | null>(null);
  const [showNew, setShowNew]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [newPrompt, setNewPrompt] = useState({
    name: "", category: "coding" as PromptCategory,
    model: "claude-sonnet-4-6", content: "", tags: "",
  });

  const apiKey = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY ?? "";
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    try {
      const url = filter === "all" ? "/api/corporate-prompts" : `/api/corporate-prompts?category=${filter}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
      const data = await res.json();
      setPrompts(data.prompts ?? []);
    } finally {
      setLoading(false);
    }
  }, [filter, apiKey]);

  useEffect(() => { load(); }, [load]);

  async function copy(content: string, id: string) {
    await navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  async function togglePin(prompt: CorporatePrompt) {
    await fetch(`/api/corporate-prompts?id=${prompt.id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ pinned: !prompt.pinned }),
    });
    load();
  }

  async function deletePrompt(id: string) {
    await fetch(`/api/corporate-prompts?id=${id}`, { method: "DELETE", headers });
    load();
  }

  async function createPrompt(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/corporate-prompts", {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...newPrompt,
          tags: newPrompt.tags.split(",").map(t => t.trim()).filter(Boolean),
        }),
      });
      setNewPrompt({ name: "", category: "coding", model: "claude-sonnet-4-6", content: "", tags: "" });
      setShowNew(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
         className="rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Brain className="w-5 h-5 text-violet-400" />
          <h2 className="font-semibold text-white">Corporate LLM Prompts</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
            {prompts.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNew(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                       bg-violet-500/10 text-violet-300 border border-violet-500/20
                       hover:bg-violet-500/20 transition-colors">
            <Plus className="w-3.5 h-3.5" /> Neu
          </button>
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-1 px-4 py-2.5 border-b overflow-x-auto" style={{ borderColor: "var(--border)" }}>
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setFilter(cat.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              filter === cat.value
                ? `${cat.color} bg-white/5`
                : "text-zinc-600 hover:text-zinc-300"
            }`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* New Prompt Form */}
      {showNew && (
        <form onSubmit={createPrompt}
              className="px-5 py-4 border-b space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
          <div className="grid grid-cols-2 gap-3">
            <input required value={newPrompt.name} onChange={e => setNewPrompt(p => ({ ...p, name: e.target.value }))}
              placeholder="Name"
              className="col-span-2 px-3 py-2 rounded-lg text-sm bg-white/5 border text-white placeholder-zinc-600 outline-none focus:border-violet-500"
              style={{ borderColor: "var(--border)" }} />
            <select value={newPrompt.category}
              onChange={e => setNewPrompt(p => ({ ...p, category: e.target.value as PromptCategory }))}
              className="px-3 py-2 rounded-lg text-sm bg-white/5 border text-white outline-none focus:border-violet-500"
              style={{ borderColor: "var(--border)" }}>
              {CATEGORIES.filter(c => c.value !== "all").map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select value={newPrompt.model}
              onChange={e => setNewPrompt(p => ({ ...p, model: e.target.value }))}
              className="px-3 py-2 rounded-lg text-sm bg-white/5 border text-white outline-none focus:border-violet-500"
              style={{ borderColor: "var(--border)" }}>
              {DEFAULT_MODELS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <textarea required rows={4} value={newPrompt.content}
            onChange={e => setNewPrompt(p => ({ ...p, content: e.target.value }))}
            placeholder="System-Prompt Inhalt…"
            className="w-full px-3 py-2 rounded-lg text-sm bg-white/5 border text-white placeholder-zinc-600
                       outline-none focus:border-violet-500 resize-none font-mono"
            style={{ borderColor: "var(--border)" }} />
          <div className="flex items-center gap-3">
            <input value={newPrompt.tags}
              onChange={e => setNewPrompt(p => ({ ...p, tags: e.target.value }))}
              placeholder="Tags (kommagetrennt)"
              className="flex-1 px-3 py-2 rounded-lg text-sm bg-white/5 border text-white placeholder-zinc-600 outline-none focus:border-violet-500"
              style={{ borderColor: "var(--border)" }} />
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-500 transition-colors disabled:opacity-50">
              {saving ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </form>
      )}

      {/* Prompt List */}
      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>Lade Prompts…</div>
        ) : prompts.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Noch keine Prompts — klick auf &bdquo;Neu&ldquo;
          </div>
        ) : (
          prompts.map(p => (
            <div key={p.id}>
              <div
                className="flex items-start justify-between px-5 py-3.5 hover:bg-white/3 cursor-pointer transition-colors"
                onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                <div className="flex items-start gap-3 min-w-0">
                  {p.pinned && <Pin className="w-3.5 h-3.5 text-violet-400 mt-0.5 flex-shrink-0" />}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{p.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${CAT_BADGE[p.category]}`}>
                        {p.category}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
                        {p.model.split("-").slice(1, 3).join("-")}
                      </span>
                    </div>
                    <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                      {p.content}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  <button onClick={e => { e.stopPropagation(); copy(p.content, p.id); }}
                    className="p-1.5 rounded hover:bg-white/5 transition-colors"
                    title="Kopieren">
                    {copied === p.id
                      ? <Check className="w-3.5 h-3.5 text-emerald-400" />
                      : <Copy className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-300" />
                    }
                  </button>
                  <button onClick={e => { e.stopPropagation(); togglePin(p); }}
                    className="p-1.5 rounded hover:bg-white/5 transition-colors"
                    title={p.pinned ? "Unpin" : "Pinnen"}>
                    <Pin className={`w-3.5 h-3.5 ${p.pinned ? "text-violet-400" : "text-zinc-600 hover:text-zinc-300"}`} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); deletePrompt(p.id); }}
                    className="p-1.5 rounded hover:bg-red-500/10 transition-colors"
                    title="Löschen">
                    <Trash2 className="w-3.5 h-3.5 text-zinc-600 hover:text-red-400" />
                  </button>
                  {expanded === p.id ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600 ml-1" />
                                     : <ChevronDown className="w-3.5 h-3.5 text-zinc-600 ml-1" />}
                </div>
              </div>

              {expanded === p.id && (
                <div className="px-5 pb-4" style={{ background: "var(--bg)" }}>
                  <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono p-3 rounded-lg
                                  border overflow-x-auto" style={{ borderColor: "var(--border)" }}>
                    {p.content}
                  </pre>
                  {p.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      {p.tags.map(tag => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-full"
                              style={{ background: "var(--surface)", color: "var(--text-muted)" }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
