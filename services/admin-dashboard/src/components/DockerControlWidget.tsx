"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Play, Square, Container, AlertTriangle } from "lucide-react";

interface DockerContainer {
  Id: string;
  Names: string[];
  Image: string;
  State: "running" | "exited" | "paused" | "restarting" | "dead" | string;
  Status: string;
  Ports: { PrivatePort: number; PublicPort?: number; Type: string }[];
  Created: number;
}

const stateColors: Record<string, string> = {
  running:    "bg-emerald-500",
  exited:     "bg-red-500",
  paused:     "bg-amber-400",
  restarting: "bg-blue-400 animate-pulse",
  dead:       "bg-zinc-600",
};

const stateLabels: Record<string, string> = {
  running:    "Running",
  exited:     "Exited",
  paused:     "Paused",
  restarting: "Restarting",
  dead:       "Dead",
};

export function DockerControlWidget() {
  const [containers, setContainers] = useState<DockerContainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/docker/containers");
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      setContainers(data.containers ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verbindung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15_000);
    return () => clearInterval(iv);
  }, [load]);

  async function act(id: string, action: "start" | "stop" | "restart") {
    setActing(id);
    try {
      await fetch(`/api/docker/containers/${id}/${action}`, { method: "POST" });
      setTimeout(load, 1000);
    } finally {
      setActing(null);
    }
  }

  const displayed = showAll ? containers : containers.filter(c => c.State === "running").slice(0, 10);
  const runningCount = containers.filter(c => c.State === "running").length;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
         className="rounded-2xl overflow-hidden">

      <div className="flex items-center justify-between px-5 py-4 border-b"
           style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <Container className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-white">Docker – Mac</h2>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {runningCount} running
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAll(v => !v)}
            className="text-xs px-2 py-1 rounded hover:bg-white/5 transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            {showAll ? "Nur Running" : `Alle (${containers.length})`}
          </button>
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {error ? (
          <div className="px-5 py-8 text-center">
            <AlertTriangle className="w-7 h-7 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-amber-300 mb-1">Docker Remote API nicht erreichbar</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Setze <code className="text-blue-400">DOCKER_HOST</code> in den Coolify env vars<br />
              z.B. <code className="text-blue-400">tcp://mac-ip:2375</code>
            </p>
          </div>
        ) : loading && !containers.length ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Lade Container…
          </div>
        ) : displayed.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Keine laufenden Container
          </div>
        ) : (
          displayed.map(c => {
            const name = (c.Names[0] ?? c.Id.slice(0, 12)).replace(/^\//, "");
            const isRunning = c.State === "running";
            return (
              <div key={c.Id} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${stateColors[c.State] ?? "bg-zinc-600"}`} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{name}</div>
                    <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                      {c.Image}
                      {c.Ports.length > 0 && (
                        <span className="ml-2 text-blue-400">
                          :{c.Ports.filter(p => p.PublicPort).map(p => p.PublicPort).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-xs mr-2" style={{ color: "var(--text-muted)" }}>
                    {stateLabels[c.State] ?? c.State}
                  </span>
                  {isRunning ? (
                    <button
                      onClick={() => act(c.Id, "stop")}
                      disabled={acting === c.Id}
                      title="Stop"
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => act(c.Id, "start")}
                      disabled={acting === c.Id}
                      title="Start"
                      className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-40"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
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
