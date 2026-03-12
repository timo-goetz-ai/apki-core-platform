"use client";

import { useEffect, useState, useCallback } from "react";
import { CategorySection } from "./category-section";
import type { CategoryConfig, ServiceConfig, ServiceStatus } from "@/lib/types";

interface StatusGridProps {
  services: ServiceConfig[];
  categories: CategoryConfig[];
}

export function StatusGrid({ services, categories }: StatusGridProps) {
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
    <div className="space-y-10">
      <div className="flex items-center gap-4 text-sm text-zinc-500">
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
          {loading ? "prüfe…" : `${onlineCount}/${services.length} online`}
        </span>
        {!loading && (
          <span className="text-zinc-700 text-xs">Auto-refresh 30s</span>
        )}
      </div>

      {categories.map((cat) => (
        <CategorySection
          key={cat.id}
          label={cat.label}
          services={services.filter((s) => s.category === cat.id)}
          statuses={statuses}
        />
      ))}

      {/* fallback: services ohne bekannte Kategorie */}
      {(() => {
        const knownCatIds = new Set(categories.map((c) => c.id));
        const rest = services.filter((s) => !knownCatIds.has(s.category));
        return rest.length > 0 ? (
          <CategorySection label="Weitere Services" services={rest} statuses={statuses} />
        ) : null;
      })()}
    </div>
  );
}
