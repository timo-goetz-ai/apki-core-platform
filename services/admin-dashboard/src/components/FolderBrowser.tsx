"use client";

import { useEffect, useState } from "react";
import type { FsEntry } from "@/app/api/agentic-os/[category]/route";

type Props = {
  category: string;
  title: string;
  icon: string;
  onSelectFile?: (entry: FsEntry, content: string) => void;
  selectable?: boolean;   // zeigt "Auswählen" Button bei .md-Dateien
};

const EXT_ICON: Record<string, string> = {
  ".md": "📝", ".txt": "📄", ".json": "🔧", ".yaml": "⚙️", ".yml": "⚙️",
  ".py": "🐍", ".ts": "📘",
};

export function FolderBrowser({ category, title, icon, onSelectFile, selectable }: Props) {
  const [entries, setEntries] = useState<FsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [preview, setPreview] = useState<{ entry: FsEntry; content: string } | null>(null);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/agentic-os/${category}`)
      .then((r) => r.json())
      .then((d) => {
        setEntries(d.entries ?? []);
        setConfigured(d.configured !== false);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [category]);

  async function openFile(entry: FsEntry) {
    if (entry.type === "directory") return;
    setLoadingFile(entry.name);
    try {
      const r = await fetch(`/api/agentic-os/file?path=${encodeURIComponent(entry.path)}`);
      const data = await r.json();
      setPreview({ entry, content: data.content ?? "" });
      if (onSelectFile) onSelectFile(entry, data.content ?? "");
    } catch {
      // ignore
    } finally {
      setLoadingFile(null);
    }
  }

  if (loading) {
    return (
      <div className="card p-6 text-center text-slate-600 text-sm animate-pulse">
        Lade {title}…
      </div>
    );
  }

  if (!configured) {
    return (
      <div className="card p-6 space-y-2">
        <p className="text-xs font-semibold text-amber-400">⚠️ Pfad nicht konfiguriert</p>
        <p className="text-xs text-slate-500">
          Setze <code className="font-mono">AGENTIC_OS_BASE_PATH</code> in Coolify.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <span>{icon}</span>
            <span className="text-sm font-semibold">{title}</span>
            <span className="text-xs text-slate-600 bg-[var(--layer-0)] px-2 py-0.5 rounded-full">
              {entries.length} Einträge
            </span>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="p-6 text-center text-slate-600 text-xs">Ordner ist leer</div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {entries.map((entry) => {
              const extIcon = entry.type === "directory"
                ? "📁"
                : (EXT_ICON[entry.ext] ?? "📄");
              const isSelectable = selectable && entry.type === "file" && entry.ext === ".md";

              return (
                <div
                  key={entry.name}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-base shrink-0">{extIcon}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{entry.displayName}</p>
                      <p className="text-[10px] font-mono text-slate-600 truncate">{entry.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] text-slate-700">
                      {new Date(entry.modified).toLocaleDateString("de-DE")}
                    </span>
                    {entry.type === "file" && (
                      <>
                        <button
                          onClick={() => openFile(entry)}
                          disabled={loadingFile === entry.name}
                          className="text-[10px] text-slate-600 hover:text-slate-300 transition-colors px-2 py-1 rounded hover:bg-white/5"
                        >
                          {loadingFile === entry.name ? "…" : "Ansehen"}
                        </button>
                        {isSelectable && (
                          <button
                            onClick={() => openFile(entry)}
                            className="text-[10px] text-[var(--accent-blue)] hover:text-[var(--accent-blue)]/80 transition-colors px-2 py-1 rounded hover:bg-[var(--accent-blue)]/10 font-medium"
                          >
                            Verwenden
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Datei-Vorschau */}
      {preview && (
        <div className="card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <span className="text-base">📝</span>
              <span className="text-sm font-semibold truncate">{preview.entry.displayName}</span>
              <span className="text-[10px] font-mono text-slate-600">{preview.entry.name}</span>
            </div>
            <button
              onClick={() => setPreview(null)}
              className="text-slate-600 hover:text-slate-300 text-xs"
            >
              ✕
            </button>
          </div>
          <div className="p-4 max-h-96 overflow-y-auto">
            <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
              {preview.content}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
