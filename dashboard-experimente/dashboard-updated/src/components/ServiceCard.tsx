// src/components/ServiceCard.tsx
"use client";

import { ServiceConfig } from "@/lib/services.config";
import { useServiceStore } from "@/store/useServiceStore";
import { StatusBadge } from "./StatusBadge";
import { ServiceStatus } from "@/types";
import { ExternalLink } from "lucide-react";
import * as Icons from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  service: ServiceConfig;
}

const CATEGORY_ACCENT: Record<string, string> = {
  automation: "from-violet-500/10",
  data: "from-blue-500/10",
  auth: "from-orange-500/10",
  monitoring: "from-cyan-500/10",
  storage: "from-teal-500/10",
  ai: "from-fuchsia-500/10",
  home: "from-green-500/10",
};

const CATEGORY_BORDER: Record<string, string> = {
  automation: "group-hover:border-violet-500/40",
  data: "group-hover:border-blue-500/40",
  auth: "group-hover:border-orange-500/40",
  monitoring: "group-hover:border-cyan-500/40",
  storage: "group-hover:border-teal-500/40",
  ai: "group-hover:border-fuchsia-500/40",
  home: "group-hover:border-green-500/40",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function DynamicIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[name];
  if (!Icon) return <Icons.Box className={className} />;
  return <Icon className={className} />;
}

export function ServiceCard({ service }: Props) {
  const health = useServiceStore((s) => s.health[service.proxyKey]);

  const status: ServiceStatus = health?.status ?? "loading";
  const latency = health?.latencyMs;
  const checkedAt = health?.checkedAt;

  const timeAgo = checkedAt
    ? Math.round((Date.now() - new Date(checkedAt).getTime()) / 1000)
    : null;

  return (
    <a
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group relative flex flex-col gap-3 rounded-xl border border-zinc-800",
        "bg-gradient-to-br to-zinc-900/80 p-5 transition-all duration-200",
        "hover:shadow-lg hover:shadow-black/30 cursor-pointer",
        CATEGORY_ACCENT[service.category],
        CATEGORY_BORDER[service.category]
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-zinc-800/80 p-2">
            <DynamicIcon
              name={service.icon}
              className="h-5 w-5 text-zinc-300"
            />
          </div>
          <div>
            <h3 className="font-mono text-sm font-semibold text-zinc-100 leading-none">
              {service.name}
            </h3>
            <p className="mt-1 text-xs text-zinc-500">{service.description}</p>
          </div>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5" />
      </div>

      {/* Status */}
      <div className="flex items-center justify-between">
        <StatusBadge status={status} size="sm" />
        <div className="flex items-center gap-3 font-mono text-[11px]">
          {latency !== null && latency !== undefined && (
            <span
              className={cn(
                "tabular-nums",
                latency < 200
                  ? "text-emerald-400"
                  : latency < 600
                    ? "text-amber-400"
                    : "text-red-400"
              )}
            >
              {latency}ms
            </span>
          )}
          {timeAgo !== null && (
            <span className="text-zinc-600">{timeAgo}s ago</span>
          )}
        </div>
      </div>

      {/* Latency bar */}
      {latency !== null && latency !== undefined && (
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-700",
              latency < 200
                ? "bg-emerald-400"
                : latency < 600
                  ? "bg-amber-400"
                  : "bg-red-400"
            )}
            style={{ width: `${Math.min((latency / 1000) * 100, 100)}%` }}
          />
        </div>
      )}
    </a>
  );
}
