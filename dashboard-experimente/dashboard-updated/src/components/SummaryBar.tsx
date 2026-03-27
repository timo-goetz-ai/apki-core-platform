// src/components/SummaryBar.tsx
"use client";

import { useServiceStore } from "@/store/useServiceStore";
import { cn } from "@/lib/utils";

export function SummaryBar() {
  const summary = useServiceStore((s) => s.getSummary());
  const lastCheck = useServiceStore((s) => s.lastGlobalCheck);

  const timeAgo = lastCheck
    ? Math.round((Date.now() - new Date(lastCheck).getTime()) / 1000)
    : null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-3.5">
      {/* Stats */}
      <div className="flex items-center gap-6 font-mono text-sm">
        <Stat
          value={summary.online}
          label="Online"
          color="text-emerald-400"
        />
        <Divider />
        <Stat
          value={summary.degraded}
          label="Degraded"
          color="text-amber-400"
        />
        <Divider />
        <Stat value={summary.offline} label="Offline" color="text-red-400" />
        <Divider />
        <Stat value={`${summary.total}`} label="Services" color="text-zinc-300" />
      </div>

      {/* Uptime + last check */}
      <div className="flex items-center gap-4">
        {/* Uptime bar */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                summary.uptimePct === 100
                  ? "bg-emerald-400"
                  : summary.uptimePct >= 80
                    ? "bg-amber-400"
                    : "bg-red-400"
              )}
              style={{ width: `${summary.uptimePct}%` }}
            />
          </div>
          <span
            className={cn(
              "font-mono text-xs font-semibold tabular-nums",
              summary.uptimePct === 100
                ? "text-emerald-400"
                : summary.uptimePct >= 80
                  ? "text-amber-400"
                  : "text-red-400"
            )}
          >
            {summary.uptimePct}%
          </span>
        </div>

        {timeAgo !== null && (
          <span className="font-mono text-[11px] text-zinc-600">
            Last check {timeAgo}s ago
          </span>
        )}
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={cn("text-base font-bold tabular-nums", color)}>
        {value}
      </span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}

function Divider() {
  return <span className="text-zinc-700">·</span>;
}
