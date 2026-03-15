"use client";

import { useEffect, useState, useCallback } from "react";
import { Rocket, RefreshCw, AlertCircle, ExternalLink, Loader2 } from "lucide-react";

interface Service {
  id: string; name: string; kind: string;
  status: string; fqdn: string | null;
  repo: string | null; updatedAt: string | null;
}

const statusColor: Record<string, string> = {
  running:   "bg-emerald-500",
  stopped:   "bg-red-500",
  starting:  "bg-blue-400 animate-pulse",
  stopping:  "bg-amber-400 animate-pulse",
  error:     "bg-red-600",
  unknown:   "bg-zinc-600",
};

const statusLabel: Record<string, string> = {
  running:  "Online",
  stopped:  "Offline",
  starting: "Startet…",
  stopping: "Stoppt…",
  error:    "Fehler",
  unknown:  "Unbekannt",
};

export function CoolifyWidget() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [deploying, setDeploying] = useState<string | null>(null);
  const [flash, setFlash]       = useState<{ id: string; ok: boolean } | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_DASHBOARD_API_KEY ?? "";

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/coolify/services");
      const data = await res.json();
      if (data.error && !data.services?.length) throw new Error(data.error);
      setServices(data.services ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 30_000); return () => clearInterval(iv); }, [load]);

  async function deploy(serviceId: string) {
    setDeploying(serviceId);
    try {
      const res = await fetch("/api/coolify/deploy", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      });
      setFlash({ id: serviceId, ok: res.ok });
      setTimeout(() => setFlash(null), 3000);
      setTimeout(load, 5000);
    } finally {
      setDeploying(null);
    }
  }

  const coolifyUrl = services.length > 0
    ? process.env.NEXT_PUBLIC_COOLIFY_URL ?? ""
    : "";

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
         className="rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Rocket className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold text-white">Coolify – Hetzner</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            {services.filter(s => s.status === "running").length} online
          </span>
        </div>
        <div className="flex items-center gap-2">
          {coolifyUrl && (
            <a href={coolifyUrl} target="_blank" rel="noopener noreferrer"
               className="text-zinc-600 hover:text-zinc-300 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {error?.includes("fehlt") ? (
          <div className="px-5 py-8 text-center">
            <AlertCircle className="w-7 h-7 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-amber-300 mb-1">Coolify nicht konfiguriert</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Setze <code className="text-purple-400">COOLIFY_URL</code> und{" "}
              <code className="text-purple-400">COOLIFY_API_KEY</code> in Coolify
            </p>
          </div>
        ) : loading && !services.length ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Lade Services…
          </div>
        ) : services.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Keine Services gefunden
          </div>
        ) : (
          services.map(s => (
            <div key={s.id}
                 className={`flex items-center justify-between px-5 py-3 transition-colors ${
                   flash?.id === s.id
                     ? flash.ok ? "bg-emerald-500/5" : "bg-red-500/5"
                     : "hover:bg-white/3"
                 }`}>
              <div className="flex items-center gap-3 min-w-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor[s.status] ?? "bg-zinc-600"}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{s.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: "var(--bg)", color: "var(--text-muted)" }}>
                      {s.kind}
                    </span>
                  </div>
                  {s.fqdn && (
                    <a href={`https://${s.fqdn}`} target="_blank" rel="noopener noreferrer"
                       className="text-xs text-blue-400 hover:text-blue-300 truncate block"
                       onClick={e => e.stopPropagation()}>
                      {s.fqdn}
                    </a>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {statusLabel[s.status] ?? s.status}
                </span>
                <button
                  onClick={() => deploy(s.id)}
                  disabled={deploying === s.id}
                  title="Deploy auslösen"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
                             bg-purple-500/10 text-purple-300 border border-purple-500/20
                             hover:bg-purple-500/20 transition-colors disabled:opacity-40">
                  {deploying === s.id
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Rocket className="w-3.5 h-3.5" />
                  }
                  Deploy
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
