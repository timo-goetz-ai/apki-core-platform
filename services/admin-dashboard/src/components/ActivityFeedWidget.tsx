"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, RefreshCw, CheckCircle2, XCircle } from "lucide-react";

interface ActivityEvent {
  id: string; type: string; title: string;
  detail?: string; ts: string; ok: boolean;
}

const TYPE_META: Record<string, { icon: string; color: string }> = {
  "mac-sync":       { icon: "💻", color: "text-blue-400" },
  "deploy":         { icon: "🚀", color: "text-purple-400" },
  "docker-action":  { icon: "🐳", color: "text-blue-300" },
  "n8n-trigger":    { icon: "⚡", color: "text-red-400" },
  "prompt-created": { icon: "🧠", color: "text-violet-400" },
  "prompt-used":    { icon: "📋", color: "text-violet-300" },
  "github-push":    { icon: "🐙", color: "text-green-400" },
  "info":           { icon: "ℹ️", color: "text-zinc-400" },
};

function relTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60)    return `${diff}s`;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function ActivityFeedWidget() {
  const [events, setEvents]   = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const apiKey = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY ?? "";

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/activity?limit=30", {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setEvents(data.events ?? []);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 10_000);
    return () => clearInterval(iv);
  }, [load]);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
         className="rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-white">Activity Feed</h2>
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border)", maxHeight: "400px", overflowY: "auto" }}>
        {loading && !events.length ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Warte auf Events…
          </div>
        ) : events.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Activity className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Noch keine Aktivität — starte den Mac-Scanner oder ein Deployment
            </p>
          </div>
        ) : (
          events.map(evt => {
            const meta = TYPE_META[evt.type] ?? { icon: "•", color: "text-zinc-400" };
            return (
              <div key={evt.id} className="flex items-start gap-3 px-5 py-3 hover:bg-white/3 transition-colors">
                <span className="text-base mt-0.5 flex-shrink-0">{meta.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-white truncate">{evt.title}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {evt.ok
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        : <XCircle className="w-3.5 h-3.5 text-red-500" />
                      }
                      <span className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {relTime(evt.ts)}
                      </span>
                    </div>
                  </div>
                  {evt.detail && (
                    <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                      {evt.detail}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
