"use client";

import { useEffect, useState } from "react";

type Lead = {
  id?: number | string;
  created_at?: string;
  source?: string;
  name?: string;
  email?: string;
  status?: string;
  notes?: string;
};

export function LeadFeedWidget() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      setError(null);
      const res = await fetch("/api/leads/?limit=20");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data?.leads ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Laden");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 60_000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (s: string | undefined) => {
    if (!s) return "—";
    try {
      const d = new Date(s);
      return d.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return s;
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Lead-Feed</h2>
        <p className="text-sm text-zinc-500">Lade...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold">Lead-Feed</h2>
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {leads.length === 0 && !error ? (
        <p className="text-sm text-zinc-500">
          Keine Leads. NocoDB konfigurieren (NC_LEADS_TABLE_ID).
        </p>
      ) : (
        <ul className="space-y-3">
          {leads.map((lead, i) => (
            <li
              key={lead.id ?? i}
              className="rounded border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {lead.name || "—"}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    lead.status === "neu"
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                      : lead.status === "abgeschlossen"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                  }`}
                >
                  {lead.status || "—"}
                </span>
              </div>
              <div className="mt-1 flex gap-3 text-xs text-zinc-500">
                <span>{lead.email || "—"}</span>
                <span>{lead.source || "—"}</span>
                <span>{formatDate(lead.created_at)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
