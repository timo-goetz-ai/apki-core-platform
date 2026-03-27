// src/types/index.ts

export type ServiceStatus = "online" | "degraded" | "offline" | "loading";

export interface ServiceHealth {
  serviceId: string;
  status: ServiceStatus;
  latencyMs: number | null;
  checkedAt: string; // ISO timestamp
  error?: string;
  metrics?: Record<string, string | number>;
}

export interface DashboardSummary {
  total: number;
  online: number;
  degraded: number;
  offline: number;
  uptimePct: number;
}
