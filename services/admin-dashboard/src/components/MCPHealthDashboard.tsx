"use client";

import { useEffect, useState } from "react";

type MCPServer = {
  id: string;
  name: string;
  is_healthy: boolean;
  latency_ms: number | null;
  tool_count: number;
};

export function MCPHealthDashboard() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = async () => {
    try {
      setError(null);
      const res = await fetch("/api/mcp/servers");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setServers(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Laden");
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 60_000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">MCP Server Health</h2>
        <p className="text-sm text-zinc-500">Lade...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold">MCP Server Health</h2>
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {servers.map((s) => (
          <div
            key={s.id}
            className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {s.name}
              </span>
              <span>{s.is_healthy ? "🟢" : "🔴"}</span>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-zinc-500">
              <span>
                {s.latency_ms != null ? `${s.latency_ms} ms` : "—"}
              </span>
              <span>{s.tool_count} Tools</span>
            </div>
          </div>
        ))}
      </div>
      {servers.length === 0 && !error && (
        <p className="text-sm text-zinc-500">Keine MCP-Server gefunden.</p>
      )}
    </div>
  );
}
