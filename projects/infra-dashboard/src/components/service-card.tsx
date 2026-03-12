"use client";

import Link from "next/link";
import {
  Server,
  Workflow,
  Table,
  Activity,
  Database,
  ExternalLink,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceConfig, ServiceStatus } from "@/lib/types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  server: Server,
  workflow: Workflow,
  table: Table,
  activity: Activity,
  database: Database,
  globe: Globe,
};

const statusColors = {
  online: "bg-emerald-500",
  offline: "bg-red-500",
  slow: "bg-amber-500",
};

const statusGlow = {
  online: "shadow-emerald-500/20",
  offline: "shadow-red-500/20",
  slow: "shadow-amber-500/20",
};

interface ServiceCardProps {
  service: ServiceConfig;
  status?: ServiceStatus;
}

export function ServiceCard({ service, status }: ServiceCardProps) {
  const Icon = iconMap[service.icon] || Globe;
  const currentStatus = status?.status ?? "offline";

  return (
    <Link
      href={`/services/${service.id}`}
      className={cn(
        "group block p-6 rounded-2xl bg-zinc-900 border border-zinc-800",
        "hover:border-zinc-700 hover:bg-zinc-900/80 transition-all",
        "shadow-lg",
        statusGlow[currentStatus]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
            <Icon className="w-6 h-6 text-zinc-300" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{service.name}</h3>
            <p className="text-sm text-zinc-500">{service.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              statusColors[currentStatus],
              currentStatus === "online" && "animate-pulse"
            )}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-zinc-500">
          <ExternalLink className="w-3.5 h-3.5" />
          <span className="truncate max-w-[200px]">
            {service.url.replace("https://", "")}
          </span>
        </div>
        {status && (
          <span className="text-xs text-zinc-600 font-mono">
            {status.responseTime}ms
          </span>
        )}
      </div>
    </Link>
  );
}
