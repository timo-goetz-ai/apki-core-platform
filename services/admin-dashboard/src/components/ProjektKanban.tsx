"use client";

import { useEffect, useState } from "react";

const KANBAN_COLUMNS = [
  { id: "idee", label: "Idee" },
  { id: "planung", label: "Planung" },
  { id: "entwicklung", label: "Entwicklung" },
  { id: "review", label: "Review" },
  { id: "live", label: "Live" },
  { id: "archiv", label: "Archiv" },
] as const;

type Project = {
  id?: number | string;
  name?: string;
  Title?: string;
  status?: string;
  Status?: string;
  mcps?: string | string[];
  skills?: string | string[];
  rules?: string | string[];
  plugins?: string | string[];
  security_check_done?: boolean;
  created_at?: string;
};

function getProjectName(p: Project): string {
  return p.name ?? p.Title ?? "—";
}

function getProjectStatus(p: Project): string {
  const s = p.status ?? p.Status ?? "";
  return String(s).toLowerCase() || "idee";
}

function formatTags(val: string | string[] | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

export function ProjektKanban() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const fetchProjects = async () => {
    try {
      setError(null);
      const res = await fetch("/api/projects/?limit=100");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProjects(data?.projects ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler beim Laden");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 60_000);
    return () => clearInterval(interval);
  }, []);

  const byColumn = KANBAN_COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = projects.filter((p) => getProjectStatus(p) === col.id);
      return acc;
    },
    {} as Record<string, Project[]>
  );

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold">Projekt-Kanban</h2>
        <p className="text-sm text-zinc-500">Lade...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold">Projekt-Kanban</h2>
      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {projects.length === 0 && !error ? (
        <p className="text-sm text-zinc-500">
          Keine Projekte. NocoDB-Tabelle „projekte“ anlegen (NOCODB_PROJEKTE_TABLE_ID).
        </p>
      ) : (
        <>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {KANBAN_COLUMNS.map((col) => (
              <div
                key={col.id}
                className="min-w-[200px] shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800/50"
              >
                <h3 className="mb-3 text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {col.label}
                </h3>
                <ul className="space-y-2">
                  {byColumn[col.id]?.map((p, i) => (
                    <li
                      key={p.id ?? i}
                      onClick={() => setSelectedProject(p)}
                      className="cursor-pointer rounded border border-zinc-200 bg-white p-2 text-sm transition hover:border-zinc-300 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-500"
                    >
                      <div className="font-medium text-zinc-800 dark:text-zinc-200">
                        {getProjectName(p)}
                      </div>
                      {p.security_check_done && (
                        <span className="mt-1 inline-block text-xs text-emerald-600 dark:text-emerald-400">
                          ✓ Security
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {selectedProject && (
            <div
              className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50"
              role="dialog"
              aria-label="Projekt-Details"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {getProjectName(selectedProject)}
                </h3>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400"
                >
                  Schließen
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-zinc-500">Status: </span>
                  <span className="capitalize">{getProjectStatus(selectedProject)}</span>
                </div>
                {formatTags(selectedProject.mcps).length > 0 && (
                  <div>
                    <span className="text-zinc-500">MCPs: </span>
                    {formatTags(selectedProject.mcps).join(", ")}
                  </div>
                )}
                {formatTags(selectedProject.skills).length > 0 && (
                  <div>
                    <span className="text-zinc-500">Skills: </span>
                    {formatTags(selectedProject.skills).join(", ")}
                  </div>
                )}
                {formatTags(selectedProject.rules).length > 0 && (
                  <div>
                    <span className="text-zinc-500">Rules: </span>
                    {formatTags(selectedProject.rules).join(", ")}
                  </div>
                )}
                {formatTags(selectedProject.plugins).length > 0 && (
                  <div>
                    <span className="text-zinc-500">Plugins: </span>
                    {formatTags(selectedProject.plugins).join(", ")}
                  </div>
                )}
                <div>
                  <span className="text-zinc-500">Security-Check: </span>
                  {selectedProject.security_check_done ? "✓" : "—"}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
