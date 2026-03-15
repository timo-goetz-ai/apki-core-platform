"use client";

import { useEffect, useState, useCallback } from "react";
import { GitBranch, Star, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

interface Repo {
  id: number; name: string; fullName: string; url: string;
  stars: number; forks: number; openIssues: number;
  pushedAt: string; language: string | null; visibility: string; branch: string;
}
interface Commit { repo: string; message: string; date: string; }
interface GitHubStats {
  login: string; name: string; avatarUrl: string;
  publicRepos: number; followers: number;
  repos: Repo[]; recentCommits: Commit[];
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-400",
  JavaScript: "bg-yellow-400",
  Python:     "bg-green-400",
  Go:         "bg-cyan-400",
  Rust:       "bg-orange-400",
  Ruby:       "bg-red-400",
  CSS:        "bg-purple-400",
};

function relTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600)  return `vor ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`;
  return `vor ${Math.floor(diff / 86400)}d`;
}

export function GitHubStatsWidget() {
  const [stats, setStats]   = useState<GitHubStats | null>(null);
  const [error, setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]       = useState<"repos" | "commits">("repos");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/github/stats");
      const data = await res.json();
      if (data.error && !data.stats) throw new Error(data.error);
      setStats(data.stats);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 300_000); return () => clearInterval(iv); }, [load]);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
         className="rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57
              0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695
              -.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99
              .105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225
              -.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405
              c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225
              0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3
              0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          <h2 className="font-semibold text-white">GitHub</h2>
          {stats && (
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>@{stats.login}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
            {(["repos", "commits"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  tab === t ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                }`}>
                {t === "repos" ? "Repos" : "Commits"}
              </button>
            ))}
          </div>
          <button onClick={load} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* KPIs */}
      {stats && (
        <div className="grid grid-cols-3 gap-px border-b" style={{ borderColor: "var(--border)", background: "var(--border)" }}>
          {[
            { label: "Repos", value: stats.publicRepos },
            { label: "Followers", value: stats.followers },
            { label: "Aktiv", value: stats.repos.length },
          ].map(({ label, value }) => (
            <div key={label} className="px-4 py-3 text-center" style={{ background: "var(--surface)" }}>
              <div className="text-lg font-bold text-white">{value}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="divide-y" style={{ borderColor: "var(--border)" }}>
        {error?.includes("GITHUB_TOKEN") ? (
          <div className="px-5 py-8 text-center">
            <AlertCircle className="w-7 h-7 text-amber-400 mx-auto mb-2" />
            <p className="text-sm text-amber-300 mb-1">GitHub nicht konfiguriert</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Setze <code className="text-green-400">GITHUB_TOKEN</code> in Coolify<br />
              (Settings → Developer → Personal Access Token)
            </p>
          </div>
        ) : loading && !stats ? (
          <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>Lade GitHub…</div>
        ) : tab === "repos" ? (
          (stats?.repos ?? []).map(repo => (
            <div key={repo.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white truncate">{repo.name}</span>
                    {repo.language && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span className={`w-2 h-2 rounded-full ${LANG_COLORS[repo.language] ?? "bg-zinc-400"}`} />
                        {repo.language}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" />{repo.branch}</span>
                    {repo.openIssues > 0 && (
                      <span className="flex items-center gap-1 text-amber-400">
                        <AlertCircle className="w-3 h-3" />{repo.openIssues}
                      </span>
                    )}
                    <span>{relTime(repo.pushedAt)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {repo.stars > 0 && (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <Star className="w-3 h-3" />{repo.stars}
                  </span>
                )}
                <a href={repo.url} target="_blank" rel="noopener noreferrer"
                   className="text-zinc-600 hover:text-zinc-300 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))
        ) : (
          (stats?.recentCommits ?? []).map((c, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3 hover:bg-white/3 transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">{c.message}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {c.repo.split("/")[1] ?? c.repo} · {relTime(c.date)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
