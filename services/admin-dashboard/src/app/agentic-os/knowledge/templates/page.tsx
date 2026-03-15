"use client";

import { FolderBrowser } from "@/components/FolderBrowser";
import { useState } from "react";
import type { FsEntry } from "@/app/api/agentic-os/[category]/route";

export default function TemplatesPage() {
  const [selected, setSelected] = useState<{ entry: FsEntry; content: string } | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">📋 Templates</h1>
        <p className="text-xs text-slate-500 mt-1">08_Templates — Task- & Dokument-Vorlagen</p>
      </div>

      {/* Aktive Vorlage */}
      {selected && (
        <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-sky-400">
              📋 Vorlage geladen: {selected.entry.displayName}
            </p>
            <button onClick={() => setSelected(null)} className="text-xs text-slate-500 hover:text-slate-300">
              ✕
            </button>
          </div>
          <pre className="text-xs font-mono text-slate-400 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
            {selected.content}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(selected.content)}
            className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors"
          >
            📋 In Zwischenablage kopieren
          </button>
        </div>
      )}

      <FolderBrowser
        category="templates"
        title="08_Templates"
        icon="📋"
        selectable
        onSelectFile={(entry, content) => setSelected({ entry, content })}
      />
    </div>
  );
}
