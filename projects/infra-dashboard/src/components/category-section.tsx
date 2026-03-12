"use client";

import { ServiceCard } from "./service-card";
import type { ServiceConfig, ServiceStatus } from "@/lib/types";

interface CategorySectionProps {
  label: string;
  services: ServiceConfig[];
  statuses: ServiceStatus[];
}

export function CategorySection({ label, services, statuses }: CategorySectionProps) {
  if (services.length === 0) return null;

  const onlineCount = services.filter((s) => {
    const st = statuses.find((x) => x.id === s.id);
    return st?.status === "online";
  }).length;

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          {label}
        </h2>
        <span className="text-xs text-zinc-700">
          {statuses.length > 0 ? `${onlineCount}/${services.length}` : services.length}
        </span>
        <div className="flex-1 h-px bg-zinc-800" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {services.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            status={statuses.find((s) => s.id === service.id)}
          />
        ))}
      </div>
    </section>
  );
}
