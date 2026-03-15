"use client";

import { FolderBrowser } from "@/components/FolderBrowser";
import { useState } from "react";
import type { FsEntry } from "@/app/api/agentic-os/[category]/route";

export default function PromptLibraryPage() {
  const [injected, setInjected] = useState<{ entry: FsEntry; content: string } | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">✍️ Prompt Library</h1>
        <p className="text-xs text-slate-500 mt-1">07_Prompt_Library — Markdown-Prompts für Dynamic Injection</p>
      </div>

      {/* Injizierter Prompt */}
      {injected && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-400">
              ✅ Prompt aktiv: {injected.entry.displayName}
            </p>
            <button
              onClick={() => setInjected(null)}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Entfernen
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            {injected.entry.name} · {(injected.entry.size / 1024).toFixed(1)} KB
          </p>
          <p className="text-xs text-slate-500 line-clamp-2">{injected.content.slice(0, 200)}…</p>
          <a
            href={`/agentic-os/engine-room/agents?prompt=${encodeURIComponent(injected.entry.path)}`}
            className="inline-block text-xs text-[#1d6ef5] hover:text-[#1d6ef5]/80 mt-1"
          >
            → Crew mit diesem Prompt starten
          </a>
        </div>
      )}

      <FolderBrowser
        category="prompts"
        title="07_Prompt_Library"
        icon="✍️"
        selectable
        onSelectFile={(entry, content) => setInjected({ entry, content })}
      />
    </div>
  );
}
