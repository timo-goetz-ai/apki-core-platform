// src/store/useServiceStore.ts
import { create } from "zustand";
import { ServiceHealth, DashboardSummary } from "@/types";
import { SERVICES } from "@/lib/services.config";

interface ServiceStore {
  health: Record<string, ServiceHealth>;
  lastGlobalCheck: string | null;

  setHealth: (serviceId: string, health: ServiceHealth) => void;
  setManyHealth: (updates: Record<string, ServiceHealth>) => void;

  getSummary: () => DashboardSummary;
}

export const useServiceStore = create<ServiceStore>((set, get) => ({
  health: {},
  lastGlobalCheck: null,

  setHealth: (serviceId, health) =>
    set((state) => ({
      health: { ...state.health, [serviceId]: health },
      lastGlobalCheck: new Date().toISOString(),
    })),

  setManyHealth: (updates) =>
    set((state) => ({
      health: { ...state.health, ...updates },
      lastGlobalCheck: new Date().toISOString(),
    })),

  getSummary: () => {
    const { health } = get();
    const total = SERVICES.length;
    const statuses = Object.values(health);
    const online = statuses.filter((s) => s.status === "online").length;
    const degraded = statuses.filter((s) => s.status === "degraded").length;
    const offline = statuses.filter((s) => s.status === "offline").length;
    const checked = online + degraded + offline;
    const uptimePct = checked > 0 ? Math.round((online / checked) * 100) : 0;
    return { total, online, degraded, offline, uptimePct };
  },
}));
