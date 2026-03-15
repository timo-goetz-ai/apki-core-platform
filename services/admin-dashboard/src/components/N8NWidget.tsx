"use client";

import { useEffect, useState, useCallback } from "react";
import { Workflow, Play, RefreshCw, AlertCircle, Loader2, CheckCircle2, XCircle } from "lucide-react";

interface Webhook {
  id: string; name: string; method: string;
  description?: string; configured: boolean;
}

interface TriggerState { id: string; status: "loading" | "ok" | "error"; }

export function N8NWidget() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading]   = useState(true);
  const [trigger, setTrigger]   = useState<TriggerState | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY ?? "";
  const headers = { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/n8n/webhooks", { headers: { Authorization: `Bearer ${apiKey}` } });
      const data = await res.json();
      setWebhooks(data.webhooks ?? []);
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => { load(); }, [load]);

  async function fire(id: string) {
    setTrigger({ id, status: "loading" });
    try {
      const res = await fetch("/api/n8n/webhooks", {
        method: "POST",
        headers,
        body: JSON.stringify({ webhookId: id }),
      });
      setTrigger({ id, status: res.ok ? "ok" : "error" });
      setTimeout(() => setTrigger(null), 3000);
    } catch {
      setTrigger({ id, status: "error" });
      setTimeout(() => setTrigger(null), 3000);
    }
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
         className="rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Workflow className="w-5 h-5 text-red-400" />
          <h2 className="font-semibold text-white">N8N Workflows</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
            {webhooks.filter(w => w.configured).length} aktiv
          </span>
        </div>
        <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {loading ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>Lade Workflows…</div>
        ) : webhooks.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <AlertCircle className="w-7 h-7 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-amber-300 mb-1">Keine Webhooks konfiguriert</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Setze <code className="text-red-400">N8N_WEBHOOK_DAILY_REPORT</code> etc. in Coolify
            </p>
          </div>
        ) : (
          webhooks.map(wh => {
            const state = trigger?.id === wh.id ? trigger.status : null;
            return (
              <div key={wh.id}
                   className={`flex items-center justify-between px-5 py-3.5 transition-colors ${
                     state === "ok"    ? "bg-emerald-500/5" :
                     state === "error" ? "bg-red-500/5" :
                     "hover:bg-white/3"
                   }`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${wh.configured ? "bg-red-400" : "bg-zinc-600"}`} />
                  <div>
                    <div className="text-sm font-medium text-white">{wh.name}</div>
                    {wh.description && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{wh.description}</div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => fire(wh.id)}
                  disabled={!wh.configured || state === "loading"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                             bg-red-500/10 text-red-300 border border-red-500/20
                             hover:bg-red-500/20 transition-colors disabled:opacity-40">
                  {state === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                   state === "ok"      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> :
                   state === "error"   ? <XCircle className="w-3.5 h-3.5 text-red-400" /> :
                   <Play className="w-3.5 h-3.5" />}
                  Trigger
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
