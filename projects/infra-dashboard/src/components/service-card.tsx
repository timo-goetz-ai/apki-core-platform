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
  Shield,
  BarChart,
  Cloud,
  Key,
  Zap,
  FileText,
  Bot,
  Mic,
  Cpu,
  Home,
  Mail,
  HardDrive,
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
  shield: Shield,
  "bar-chart": BarChart,
  cloud: Cloud,
  key: Key,
  zap: Zap,
  "file-text": FileText,
  bot: Bot,
  mic: Mic,
  cpu: Cpu,
  home: Home,
  mail: Mail,
  "hard-drive": HardDrive,
};

const statusColors = {
  online: "bg-emerald-500",
  offline: "bg-red-500",
  slow: "bg-amber-500",
};

const statusGlow = {
  online: "shadow-emerald-500/10",
  offline: "shadow-red-500/10",
  slow: "shadow-amber-500/10",
};

interface ServiceCardProps {
  service: ServiceConfig;
  status?: ServiceStatus;
}

export function ServiceCard({ service, status }: ServiceCardProps) {
  const Icon = iconMap[service.icon] ?? Globe;
  const currentStatus = status?.status ?? "offline";

  return (
    <Link
      href={service.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "group block p-5 rounded-2xl bg-zinc-900 border border-zinc-800",
        "hover:border-zinc-700 hover:bg-zinc-900/80 transition-all",
        "shadow-lg",
        statusGlow[currentStatus]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
            <Icon className="w-5 h-5 text-zinc-300" />
          </div>
          <div>
            <h3 className="font-semibold text-base leading-tight">{service.name}</h3>
            <p className="text-xs text-zinc-500 mt-0.5">{service.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
          {status?.protected && (
            <Shield className="w-3 h-3 text-zinc-600" aria-label="Authentik-geschützt" />
          )}
          <div
            className={cn(
              "w-2.5 h-2.5 rounded-full",
              statusColors[currentStatus],
              currentStatus === "online" && "animate-pulse"
            )}
          />
        </div>
      </div>

      <div className="mt-3.5 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-zinc-600">
          <ExternalLink className="w-3 h-3" />
          <span className="truncate max-w-[180px]">
            {service.url.replace("https://", "")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {service.note && (
            <span className="text-xs text-amber-600/80 truncate max-w-[80px]" title={service.note}>
              {service.note.length > 12 ? service.note.slice(0, 12) + "…" : service.note}
            </span>
          )}
          {status && (
            <span className="text-xs text-zinc-700 font-mono">{status.responseTime}ms</span>
          )}
        </div>
      </div>
    </Link>
  );
}
