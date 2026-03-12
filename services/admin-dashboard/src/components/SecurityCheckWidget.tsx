"use client";

import { useEffect, useState } from "react";

const NOCODB_URL =
  process.env.NEXT_PUBLIC_NOCODB_URL || "https://nocodb.automation-plus-ki.de";

const CHECK_ITEMS = [
  { key: "secrets_ok", label: "Secrets" },
  { key: "input_validation_ok", label: "Input-Validierung" },
  { key: "mcp_scope_ok", label: "MCP-Zugriff" },
  { key: "rate_limit_ok", label: "Rate-Limiting" },
] as const;

type SecurityCheck = {
  id?: number | string;
  projekt_id?: unknown;
  Projekt?: { Title?: string; name?: string };
  secrets_ok?: boolean;
  input_validation_ok?: boolean;
  mcp_scope_ok?: boolean;
  rate_limit_ok?: boolean;
  checked_by?: string;
  checked_at?: string;
};

function isComplete(c: SecurityCheck): boolean {
  return !!(
    c.secrets_ok &&
    c.input_validation_ok &&
    c.mcp_scope_ok &&
    c.rate_limit_ok
  );
}

function formatDate(s: string | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

function getProjectName(c: SecurityCheck): string {
  const p = c.Projekt as { Title?: string; name?: string } | undefined;
  return p?.Title ?? p?.name ?? "—";
}

export function SecurityCheckWidget() {
  const [checks, setChecks] = useState<SecurityCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChecks = async () => {
    try {
      setError(null);
      const res = await fetch("/api/security-checks/?limit=20");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setChecks(data?.security_checks ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Laden");
      setChecks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChecks();
    const interval = setInterval(fetchChecks, 60_000);
    return () => clearInterval(interval);
  }, []);

  const openCount = checks.filter((c) => !isComplete(c)).length;

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Security-Checks</h2>
        <p className="text-sm text-zinc-500">Lade...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Security-Checks</h2>
        <a
          href={NOCODB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Check durchführen
        </a>
      </div>
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {checks.length === 0 && !error ? (
        <p className="text-sm text-zinc-500">
          Keine Security-Checks. Tabelle in NocoDB anlegen (NOCODB_SECURITY_CHECKS_TABLE_ID).
        </p>
      ) : (
        <>
          {openCount > 0 && (
            <p className="mb-3 text-sm text-amber-600 dark:text-amber-400">
              {openCount} offene Check(s)
            </p>
          )}
          <ul className="space-y-3">
            {checks.map((c, i) => (
              <li
                key={c.id ?? i}
                className={`rounded border p-3 text-sm ${
                  isComplete(c)
                    ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-900/20"
                    : "border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {getProjectName(c)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      isComplete(c)
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {isComplete(c) ? "✓ Abgeschlossen" : "Offen"}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CHECK_ITEMS.map(({ key, label }) => (
                    <span
                      key={key}
                      className={`text-xs ${
                        (c as Record<string, unknown>)[key]
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {(c as Record<string, unknown>)[key] ? "✓" : "○"} {label}
                    </span>
                  ))}
                </div>
                <div className="mt-1 text-xs text-zinc-500">
                  {c.checked_by && `${c.checked_by} · `}
                  {formatDate(c.checked_at)}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
