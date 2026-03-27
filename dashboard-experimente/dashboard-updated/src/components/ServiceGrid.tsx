// src/components/ServiceGrid.tsx
"use client";

import { SERVICES, CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/services.config";
import { ServiceCard } from "./ServiceCard";
import { useAllServicesHealth } from "@/hooks/useHealthCheck";

export function ServiceGrid() {
  useAllServicesHealth(); // mounts all SWR watchers

  // Group by category, preserve CATEGORY_ORDER
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    services: SERVICES.filter((s) => s.category === cat),
  })).filter((g) => g.services.length > 0);

  return (
    <div className="space-y-8">
      {grouped.map(({ category, label, services }) => (
        <section key={category}>
          <h2 className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
            {label}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {services.map((svc) => (
              <ServiceCard key={svc.id} service={svc} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
