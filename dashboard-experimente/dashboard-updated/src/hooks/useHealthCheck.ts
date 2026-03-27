// src/hooks/useHealthCheck.ts
"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { ServiceHealth } from "@/types";
import { useServiceStore } from "@/store/useServiceStore";
import { SERVICES } from "@/lib/services.config";

const POLL_INTERVAL = 30_000; // 30s — adjust in env if needed

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<ServiceHealth>);

// ── Single service hook ───────────────────────────────────────────────────────
export function useServiceHealth(proxyKey: string) {
  const setHealth = useServiceStore((s) => s.setHealth);

  const { data, error, isLoading } = useSWR<ServiceHealth>(
    `/api/proxy/${proxyKey}`,
    fetcher,
    {
      refreshInterval: POLL_INTERVAL,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
      onSuccess: (data) => {
        setHealth(proxyKey, { ...data, serviceId: proxyKey });
      },
    }
  );

  if (error && !isLoading) {
    setHealth(proxyKey, {
      serviceId: proxyKey,
      status: "offline",
      latencyMs: null,
      checkedAt: new Date().toISOString(),
      error: error.message,
    });
  }

  return { data, error, isLoading };
}

// ── All services hook (used by dashboard overview) ────────────────────────────
export function useAllServicesHealth() {
  const setManyHealth = useServiceStore((s) => s.setManyHealth);
  const health = useServiceStore((s) => s.health);

  // Fire individual SWR fetches for all services in parallel
  // SWR deduplicates automatically
  const results = SERVICES.map((svc) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data, isLoading } = useSWR<ServiceHealth>(
      `/api/proxy/${svc.proxyKey}`,
      fetcher,
      {
        refreshInterval: POLL_INTERVAL,
        revalidateOnFocus: true,
        dedupingInterval: 5_000,
      }
    );
    return { id: svc.proxyKey, data, isLoading };
  });

  useEffect(() => {
    const updates: Record<string, ServiceHealth> = {};
    results.forEach(({ id, data }) => {
      if (data) updates[id] = { ...data, serviceId: id };
    });
    if (Object.keys(updates).length > 0) setManyHealth(updates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.map((r) => r.data).join(",")]);

  const isAnyLoading = results.some((r) => r.isLoading);
  return { health, isLoading: isAnyLoading };
}
