"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogViewerProps {
  serviceId: string;
}

interface LogData {
  lines: string[];
  statusCode?: number;
  endpoint?: string;
  fetchedAt?: string;
  error?: string;
}

export function LogViewer({ serviceId }: LogViewerProps) {
  const [logs, setLogs] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/logs/${serviceId}`);
      const data = await res.json();
      setLogs(data);
    } catch {
      setLogs({ lines: ["Failed to fetch logs"], error: "Network error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium">Response / Logs</h3>
          {logs?.statusCode && (
            <span
              className={cn(
                "text-xs font-mono px-2 py-0.5 rounded",
                logs.statusCode < 400
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-red-500/10 text-red-400"
              )}
            >
              {logs.statusCode}
            </span>
          )}
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          {logs ? "Aktualisieren" : "Logs laden"}
        </button>
      </div>

      <div className="p-4 font-mono text-xs overflow-auto max-h-[500px]">
        {!logs && (
          <p className="text-zinc-600">
            Klicke &quot;Logs laden&quot; um die Response zu sehen.
          </p>
        )}
        {logs?.lines.map((line, i) => {
          const isError =
            /error|exception|fail|fatal|panic/i.test(line);
          const isWarn = /warn/i.test(line);
          return (
            <div
              key={i}
              className={cn(
                "py-0.5 whitespace-pre-wrap break-all",
                isError && "text-red-400 bg-red-400/5",
                isWarn && "text-amber-400 bg-amber-400/5",
                !isError && !isWarn && "text-zinc-400"
              )}
            >
              <span className="text-zinc-700 select-none mr-3">{String(i + 1).padStart(3)}</span>
              {line}
            </div>
          );
        })}
      </div>

      {logs?.fetchedAt && (
        <div className="px-4 py-2 border-t border-zinc-800 text-xs text-zinc-600">
          {logs.endpoint} &middot; {new Date(logs.fetchedAt).toLocaleTimeString("de-DE")}
        </div>
      )}
    </div>
  );
}
