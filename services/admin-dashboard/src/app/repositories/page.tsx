'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  GitBranch, Star, AlertCircle, RefreshCw, ExternalLink,
  GitFork, Clock, Lock, Unlock,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Repo {
  id: number;
  name: string;
  fullName: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  pushedAt: string;
  language: string | null;
  visibility: string;
  branch: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const LANG_COLORS: Record<string, string> = {
  TypeScript: 'var(--accent-blue)',
  JavaScript: '#f7df1e',
  Python: 'var(--accent-green)',
  Go: '#00ADD8',
  Rust: '#CE422B',
  Ruby: '#CC342D',
  CSS: '#563d7c',
  Shell: '#89e051',
  Dockerfile: '#384d54',
};

function relTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `vor ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`;
  return `vor ${Math.floor(diff / 86400)}d`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-xl animate-pulse"
      style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', height: 140 }}
    />
  );
}

// ── RepoCard ─────────────────────────────────────────────────────────────────

function RepoCard({ repo }: { repo: Repo }) {
  const [owner, repoName] = repo.fullName.split('/');
  return (
    <Link
      href={`/repositories/${owner}/${repoName}`}
      className="group block rounded-xl p-4 transition-all duration-150 hover:scale-[1.01]"
      style={{
        background: 'var(--layer-2)',
        border: '1px solid var(--border)',
        textDecoration: 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {repo.visibility === 'private' ? (
            <Lock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          ) : (
            <Unlock className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
          )}
          <span
            className="font-semibold truncate text-sm group-hover:text-[var(--accent-blue)] transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            {repo.name}
          </span>
        </div>
        <a
          href={repo.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 p-1 rounded hover:bg-white/5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onClick={e => e.stopPropagation()}
          aria-label={`${repo.name} auf GitHub öffnen`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* Meta tags */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {repo.language && (
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: LANG_COLORS[repo.language] ?? 'var(--text-muted)' }}
            />
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          <GitBranch className="w-3 h-3" />
          {repo.branch}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        {repo.stars > 0 && (
          <span className="flex items-center gap-1" style={{ color: '#f59e0b' }}>
            <Star className="w-3 h-3" />
            {repo.stars}
          </span>
        )}
        {repo.forks > 0 && (
          <span className="flex items-center gap-1">
            <GitFork className="w-3 h-3" />
            {repo.forks}
          </span>
        )}
        {repo.openIssues > 0 && (
          <span className="flex items-center gap-1" style={{ color: 'var(--accent-amber)' }}>
            <AlertCircle className="w-3 h-3" />
            {repo.openIssues}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3" />
          {relTime(repo.pushedAt)}
        </span>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RepositoriesPage() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [login, setLogin] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/github/stats');
      const data = await res.json();
      if (data.error && !data.stats) throw new Error(data.error);
      setRepos(data.stats?.repos ?? []);
      setLogin(data.stats?.login ?? null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Repositories
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {login ? `@${login} · ` : ''}
            {repos.length > 0 ? `${repos.length} Repos` : 'GitHub Repositories'}
            {' — Klick auf ein Repo für Details'}
          </p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Neu laden"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div
          className="flex items-center gap-2 p-4 rounded-lg mb-6 text-sm"
          style={{ background: 'var(--layer-2)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error.includes('GITHUB_TOKEN') ? (
            <span>
              <strong>GitHub nicht konfiguriert.</strong> Setze{' '}
              <code className="text-xs bg-white/10 px-1 rounded">GITHUB_TOKEN</code>{' '}
              in Coolify (Settings → Developer → Personal Access Token).
            </span>
          ) : (
            <span>{error}</span>
          )}
        </div>
      )}

      {/* Grid */}
      {loading && repos.length === 0 ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : repos.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: 'var(--layer-2)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Keine Repositories gefunden.</p>
        </div>
      ) : (
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {repos.map(repo => <RepoCard key={repo.id} repo={repo} />)}
        </div>
      )}
    </div>
  );
}
