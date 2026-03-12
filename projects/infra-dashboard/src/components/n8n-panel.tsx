"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  ExternalLink,
  RefreshCw,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { N8NExecution, N8NWorkflow } from "@/lib/types";

const N8N_BASE = "https://n8n.automation-plus-ki.de";

function ExecutionStatus({ status }: { status: string }) {
  const map: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    success: { icon: CheckCircle, color: "text-emerald-400", label: "OK" },
    error: { icon: XCircle, color: "text-red-400", label: "Fehler" },
    waiting: { icon: Clock, color: "text-amber-400", label: "Wartet" },
    running: { icon: Loader2, color: "text-blue-400", label: "Läuft" },
  };
  const cfg = map[status] ?? map.waiting;
  const Icon = cfg.icon;
  return (
    <span className={cn("flex items-center gap-1 text-xs", cfg.color)}>
      <Icon className={cn("w-3.5 h-3.5", status === "running" && "animate-spin")} />
      {cfg.label}
    </span>
  );
}

function relTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `vor ${diff}s`;
  if (diff < 3600) return `vor ${Math.floor(diff / 60)}m`;
  return `vor ${Math.floor(diff / 3600)}h`;
}

export function N8NPanel() {
  const [workflows, setWorkflows] = useState<N8NWorkflow[]>([]);
  const [executions, setExecutions] = useState<N8NExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [wfRes, exRes] = await Promise.all([
        fetch("/api/n8n/workflows"),
        fetch("/api/n8n/executions"),
      ]);
      const wfData = await wfRes.json();
      const exData = await exRes.json();

      if (wfData.error && wfData.error.includes("not configured")) {
        setError("N8N_API_KEY fehlt – bitte in .env setzen");
      } else {
        setError(null);
      }

      setWorkflows(wfData.workflows ?? []);
      setExecutions(exData.executions ?? []);
    } catch {
      setError("Verbindung zu n8n fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [load]);

  async function triggerWorkflow(id: string) {
    setTriggering(id);
    try {
      await fetch(`/api/n8n/trigger/${id}`, { method: "POST" });
      setTimeout(load, 2000);
    } finally {
      setTriggering(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl font-semibold">n8n Workflows</h2>
          <a
            href={N8N_BASE}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all"
        >
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
          ⚠ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workflows */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Workflows</span>
            <span className="text-xs text-zinc-600">{workflows.length} gesamt</span>
          </div>
          <div className="divide-y divide-zinc-800/60 max-h-72 overflow-y-auto">
            {loading && !workflows.length ? (
              <div className="px-5 py-8 text-center text-zinc-600 text-sm">Lade...</div>
            ) : workflows.length === 0 ? (
              <div className="px-5 py-8 text-center text-zinc-600 text-sm">
                Keine Workflows – API Key prüfen
              </div>
            ) : (
              workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="flex items-center justify-between px-5 py-3 hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full flex-shrink-0",
                          wf.active ? "bg-emerald-500" : "bg-zinc-600"
                        )}
                      />
                      <span className="text-sm font-medium truncate">{wf.name}</span>
                    </div>
                    {wf.tags && wf.tags.length > 0 && (
                      <div className="flex gap-1 mt-1 ml-4">
                        {wf.tags.slice(0, 3).map((t) => (
                          <span
                            key={t.id}
                            className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500"
                          >
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => triggerWorkflow(wf.id)}
                    disabled={triggering === wf.id || !wf.active}
                    title={wf.active ? "Workflow starten" : "Workflow inaktiv"}
                    className={cn(
                      "ml-3 p-1.5 rounded-lg transition-all flex-shrink-0",
                      wf.active
                        ? "text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
                        : "text-zinc-700 cursor-not-allowed"
                    )}
                  >
                    {triggering === wf.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Executions */}
        <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-400">Letzte Ausführungen</span>
            <span className="text-xs text-zinc-600">{executions.length} Einträge</span>
          </div>
          <div className="divide-y divide-zinc-800/60 max-h-72 overflow-y-auto">
            {loading && !executions.length ? (
              <div className="px-5 py-8 text-center text-zinc-600 text-sm">Lade...</div>
            ) : executions.length === 0 ? (
              <div className="px-5 py-8 text-center text-zinc-600 text-sm">
                Keine Ausführungen
              </div>
            ) : (
              executions.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm truncate block">
                      {ex.workflowName ?? `Workflow ${ex.workflowId}`}
                    </span>
                    <span className="text-xs text-zinc-600">{relTime(ex.startedAt)}</span>
                  </div>
                  <ExecutionStatus status={ex.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
