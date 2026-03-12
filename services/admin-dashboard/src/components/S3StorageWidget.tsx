"use client";

import { useEffect, useState } from "react";

// Neumorphism + Giftiges Rot (#e63946) + Grün (#00C853)
const TOXIC_RED = "#e63946";
const HEALTHY_GREEN = "#00C853";
const WARNING_AMBER = "#ffab00";

type S3Metrics = {
  used_storage_gb?: number;
  total_storage_gb?: number;
  usage_percentage?: number;
  available_storage_gb?: number;
  weekly_growth_gb?: number;
  monthly_cost_eur?: number;
  status?: "HEALTHY" | "WARNING" | "CRITICAL";
};

type S3Config = {
  bucket_name?: string;
  region?: string;
  created_date?: string;
  last_modified_date?: string;
  endpoint_url?: string;
  api_version?: string;
  versioning_enabled?: boolean;
  transfer_acceleration?: boolean;
  acl_policy?: string;
};

type S3Backup = {
  last_backup_date?: string;
  last_backup_status?: string;
  last_backup_size_gb?: number;
  next_backup_scheduled?: string;
  backup_frequency?: string;
  backup_retention_days?: number;
  last_integrity_check?: string;
  integrity_status?: string;
  backup_health?: string;
  update_schedule?: string;
  last_update_check?: string;
  last_update_applied?: string;
  pending_updates_count?: number;
  update_status?: string;
};

const DEMO_DATA: S3Metrics & S3Config & S3Backup = {
  used_storage_gb: 45.2,
  total_storage_gb: 100,
  usage_percentage: 45,
  available_storage_gb: 54.8,
  weekly_growth_gb: 2.1,
  monthly_cost_eur: 3.24,
  status: "HEALTHY",
  bucket_name: "timo-workspace",
  region: "eu-de",
  created_date: "2024-06-15",
  last_modified_date: "2025-03-07",
  endpoint_url: "eu-de.spaces.de",
  api_version: "v3",
  versioning_enabled: true,
  transfer_acceleration: false,
  acl_policy: "Private",
  last_backup_date: "2025-03-08T02:15:00",
  last_backup_status: "Success",
  last_backup_size_gb: 45.2,
  next_backup_scheduled: "2025-03-09T02:00:00",
  backup_frequency: "Täglich (02:00)",
  backup_retention_days: 30,
  last_integrity_check: "2025-03-08T03:45:00",
  integrity_status: "Verified",
  backup_health: "HEALTHY",
  update_schedule: "Wöchentlich (Fr)",
  last_update_applied: "2025-03-07T19:30:00",
  pending_updates_count: 0,
  update_status: "Up-to-date",
};

const STATUS_STYLES = {
  HEALTHY: { color: HEALTHY_GREEN, bg: "rgba(0,200,83,0.15)", label: "HEALTHY" },
  WARNING: { color: WARNING_AMBER, bg: "rgba(255,171,0,0.15)", label: "WARNING" },
  CRITICAL: { color: TOXIC_RED, bg: "rgba(230,57,70,0.2)", label: "CRITICAL" },
};

function formatDate(s?: string) {
  if (!s) return "—";
  try {
    const d = new Date(s);
    return d.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

export function S3StorageWidget() {
  const [data, setData] = useState<S3Metrics & S3Config & S3Backup>(DEMO_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [livePulse, setLivePulse] = useState(true);

  const fetchData = async () => {
    const apiUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL;
    const fetchUrl = apiUrl ? `${apiUrl}/api/s3/metrics` : null;

    if (!fetchUrl) {
      setError("Keine API");
      setData(DEMO_DATA);
      setLastUpdate(new Date());
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const res = await fetch(fetchUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData((prev) => ({ ...DEMO_DATA, ...json }));
      setLastUpdate(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
      setData(DEMO_DATA);
      setLastUpdate(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000); // Live: alle 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setLivePulse((p) => !p), 1500);
    return () => clearInterval(t);
  }, []);

  if (loading && !data.used_storage_gb) {
    return (
      <div
        className="rounded-2xl p-5 dark:bg-zinc-900/80"
        style={{
          background: "linear-gradient(145deg, #f0f0f0, #e8e8e8)",
          boxShadow: "inset 4px 4px 8px #d1d1d1, inset -4px -4px 8px #ffffff",
        }}
      >
        <h2 className="mb-4 text-lg font-semibold text-zinc-700 dark:text-zinc-200">
          💾 Hetzner S3 Storage
        </h2>
        <p className="text-sm text-zinc-500">Lade...</p>
      </div>
    );
  }

  const status = data.status || "HEALTHY";
  const pct = data.usage_percentage ?? 0;
  const statusStyle = STATUS_STYLES[status as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.HEALTHY;
  // Gradient: Grün → Giftiges Rot je nach Auslastung
  const barColor =
    pct >= 95
      ? TOXIC_RED
      : pct >= 80
        ? WARNING_AMBER
        : `linear-gradient(90deg, ${HEALTHY_GREEN}, ${pct > 50 ? WARNING_AMBER : HEALTHY_GREEN})`;

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "linear-gradient(145deg, #f5f5f5, #ebebeb)",
        boxShadow:
          "8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff, inset 1px 1px 0 rgba(255,255,255,0.5)",
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-700 dark:text-zinc-200">
          💾 Hetzner S3 Storage
        </h2>
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider"
          style={{
            color: HEALTHY_GREEN,
            backgroundColor: "rgba(0,200,83,0.12)",
            boxShadow: "inset 0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${livePulse ? "opacity-100" : "opacity-40"}`}
            style={{ backgroundColor: HEALTHY_GREEN, transition: "opacity 0.3s" }}
          />
          Live
        </span>
      </div>
      {error && (
        <p className="mb-2 text-xs" style={{ color: WARNING_AMBER }}>
          Demo ({error})
        </p>
      )}

      {/* Speicher – Neumorphism Panel */}
      <section
        className="mb-4 rounded-xl p-3"
        style={{
          background: "linear-gradient(145deg, #e8e8e8, #f2f2f2)",
          boxShadow: "inset 3px 3px 6px #d0d0d0, inset -3px -3px 6px #ffffff",
        }}
      >
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Speicher
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between font-medium">
            <span className="text-zinc-600 dark:text-zinc-400">Genutzt:</span>
            <span className="text-zinc-800 dark:text-zinc-100">
              {data.used_storage_gb ?? "—"} / {data.total_storage_gb ?? "—"} GB
            </span>
          </div>
          <div
            className="h-3 overflow-hidden rounded-full"
            style={{
              background: "linear-gradient(145deg, #d8d8d8, #e8e8e8)",
              boxShadow: "inset 2px 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(pct, 100)}%`,
                background: barColor,
                boxShadow: "0 0 8px rgba(0,200,83,0.3)",
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Verfügbar: {data.available_storage_gb ?? "—"} GB</span>
            <span>↑ +{(data.weekly_growth_gb ?? 0).toFixed(1)} GB/Woche</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span
              className="rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase"
              style={{
                color: statusStyle.color,
                backgroundColor: statusStyle.bg,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.3)",
              }}
            >
              {statusStyle.label}
            </span>
            <span className="text-xs font-medium" style={{ color: TOXIC_RED }}>
              ~€{(data.monthly_cost_eur ?? 0).toFixed(2)}/Monat
            </span>
          </div>
        </div>
      </section>

      {/* Versionen & Config */}
      <section
        className="mb-4 rounded-xl p-3"
        style={{
          background: "linear-gradient(145deg, #e8e8e8, #f2f2f2)",
          boxShadow: "inset 3px 3px 6px #d0d0d0, inset -3px -3px 6px #ffffff",
        }}
      >
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Versionen & Config
        </h3>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <span className="text-zinc-500">Region:</span>
          <span className="text-zinc-700 dark:text-zinc-300">{data.region ?? "—"}</span>
          <span className="text-zinc-500">Bucket:</span>
          <span className="text-zinc-700 dark:text-zinc-300">{data.bucket_name ?? "—"}</span>
          <span className="text-zinc-500">API:</span>
          <span className="text-zinc-700 dark:text-zinc-300">{data.api_version ?? "—"}</span>
          <span className="text-zinc-500">Versioning:</span>
          <span className="text-zinc-700 dark:text-zinc-300">
            {data.versioning_enabled ? "✅" : "❌"}
          </span>
          <span className="text-zinc-500">ACL:</span>
          <span className="text-zinc-700 dark:text-zinc-300">{data.acl_policy ?? "—"}</span>
        </div>
      </section>

      {/* Backup & Updates */}
      <section
        className="rounded-xl p-3"
        style={{
          background: "linear-gradient(145deg, #e8e8e8, #f2f2f2)",
          boxShadow: "inset 3px 3px 6px #d0d0d0, inset -3px -3px 6px #ffffff",
        }}
      >
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Backup & Updates
        </h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Letzte:</span>
            <span className="text-zinc-700 dark:text-zinc-300">
              {formatDate(data.last_backup_date)}{" "}
              {data.last_backup_status === "Success" ? (
                <span style={{ color: HEALTHY_GREEN }}>✅</span>
              ) : (
                <span style={{ color: TOXIC_RED }}>❌</span>
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Nächste:</span>
            <span className="text-zinc-700 dark:text-zinc-300">
              {formatDate(data.next_backup_scheduled)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Retention:</span>
            <span className="text-zinc-700 dark:text-zinc-300">
              {data.backup_retention_days ?? "—"} Tage
            </span>
          </div>
          {lastUpdate && (
            <div className="mt-2 border-t border-zinc-200/50 pt-2 text-[10px] text-zinc-400">
              Aktualisiert: {lastUpdate.toLocaleTimeString("de-DE")}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
