"use client";

import { useEffect, useState, useCallback } from "react";
import { ServiceCard } from "./service-card";
import type { ServiceConfig, ServiceStatus } from "@/lib/types";

interface StatusGridProps {
  services: ServiceConfig[];
}

export function StatusGrid({ services }: StatusGridProps) {
  const [statuses, setStatuses] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setStatuses(data.statuses);
    } catch {
      // keep previous statuses
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatuses();
    const interval = setInterval(fetchStatuses, 30000);
    return () => clearInterval(interval);
  }, [fetchStatuses]);

  const onlineCount = statuses.filter((s) => s.status === "online").length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="flex items-center gap-2 text-sm text-zinc-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          {loading ? "..." : `${onlineCount}/${services.length} online`}
        </span>
        {!loading && (
          <span className="text-xs text-zinc-600">
            Auto-refresh 30s
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            status={statuses.find((s) => s.id === service.id)}
          />
        ))}
      </div>
    </div>
  );
}
