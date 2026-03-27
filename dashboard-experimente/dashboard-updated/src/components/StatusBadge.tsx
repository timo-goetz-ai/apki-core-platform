// src/components/StatusBadge.tsx
"use client";

import { ServiceStatus } from "@/types";
import { cn } from "@/lib/utils";

const CONFIG: Record<
  ServiceStatus,
  { label: string; dot: string; text: string; bg: string }
> = {
  online: {
    label: "ONLINE",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
    bg: "bg-emerald-400/10 border-emerald-400/20",
  },
  degraded: {
    label: "DEGRADED",
    dot: "bg-amber-400",
    text: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
  },
  offline: {
    label: "OFFLINE",
    dot: "bg-red-500",
    text: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  loading: {
    label: "CHECKING",
    dot: "bg-zinc-400 animate-pulse",
    text: "text-zinc-400",
    bg: "bg-zinc-400/10 border-zinc-400/20",
  },
};

interface Props {
  status: ServiceStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: Props) {
  const c = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded border px-2 font-mono font-semibold tracking-wider",
        c.bg,
        c.text,
        size === "sm" ? "text-[10px] py-0.5" : "text-xs py-1"
      )}
    >
      <span className={cn("rounded-full flex-shrink-0", c.dot, size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2")} />
      {c.label}
    </span>
  );
}
