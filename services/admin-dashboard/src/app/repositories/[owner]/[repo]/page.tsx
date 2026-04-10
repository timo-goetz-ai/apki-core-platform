'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  GitBranch, Star, GitFork, AlertCircle, RefreshCw, ExternalLink,
  FileText, Folder, GitCommit, GitPullRequest, ArrowLeft,
  Globe, BookOpen, Clock, Lock, Tag, ChevronRight, Shield,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface RepoInfo {
  name: string;
  fullName: string;
  description: string | null;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  visibility: string;
  branch: string;
  pushedAt: string;
  createdAt: string;
  topics: string[];
  homepage: string | null;
  hasWiki: boolean;
  hasPages: boolean;
  issuesUrl: string;
  prsUrl: string;
  actionsUrl: string;
}

interface RepoFile {
  name: string;
  path: string;
  type: 'file' | 'dir';
  url: string;
}

interface RepoCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface RepoBranch {
  name: string;
  protected: boolean;
}

interface PullRequest {
  number: number;
  title: string;
  state: string;
  url: string;
  updatedAt: string;
  author: string;
}

interface RepoDetail {
  repo: RepoInfo;
  readme: string | null;
  files: RepoFile[];
  commits: RepoCommit[];
  branches: RepoBranch[];
  pullRequests: PullRequest[];
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
};

function relTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 3600) return `vor ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)}h`;
  return `vor ${Math.floor(diff / 86400)}d`;
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Section card ──────────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, count }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--layer-2)', border: '1px solid var(--border)' }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <Icon className="w-4 h-4" style={{ color: 'var(--accent-blue)' }} />
        <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</span>
        {count !== undefined && (
          <span
            className="ml-auto text-xs font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'var(--layer-3)', color: 'var(--text-muted)' }}
          >
            {count}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Quick Links ───────────────────────────────────────────────────────────────

function QuickLinks({ repo }: { repo: RepoInfo }) {
  const links: { label: string; href: string; icon: React.ElementType; external?: boolean }[] = [
    { label: 'GitHub', href: repo.url, icon: ExternalLink, external: true },
    { label: 'Issues', href: repo.issuesUrl, icon: AlertCircle, external: true },
    { label: 'Pull Requests', href: repo.prsUrl, icon: GitPullRequest, external: true },
    { label: 'Actions', href: repo.actionsUrl, icon: GitBranch, external: true },
  ];
  if (repo.hasWiki) {
    links.push({ label: 'Wiki', href: `${repo.url}/wiki`, icon: BookOpen, external: true });
  }
  if (repo.homepage) {
    links.push({ label: 'Homepage', href: repo.homepage, icon: Globe, external: true });
  }

  return (
    <Section title="Links" icon={ExternalLink}>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {links.map(link => (
          <a
            key={link.label}
            href={link.href}
            target={link.external ? '_blank' : undefined}
            rel={link.external ? 'noopener noreferrer' : undefined}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-white/3 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <div className="flex items-center gap-2.5">
              <link.icon className="w-3.5 h-3.5" style={{ color: 'var(--accent-blue)' }} />
              <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{link.label}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
          </a>
        ))}
      </div>
    </Section>
  );
}

// ── File Tree ────────────────────────────────────────────────────────────────

function FileTree({ files }: { files: RepoFile[] }) {
  const sorted = [...files].sort((a, b) => {
    if (a.type === b.type) return a.name.localeCompare(b.name);
    return a.type === 'dir' ? -1 : 1;
  });

  return (
    <Section title="Dateien" icon={FileText} count={files.length}>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {sorted.map(f => (
          <a
            key={f.path}
            href={f.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 px-4 py-2 hover:bg-white/3 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            {f.type === 'dir' ? (
              <Folder className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#f59e0b' }} />
            ) : (
              <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            )}
            <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{f.name}</span>
            <ExternalLink className="w-3 h-3 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100" style={{ color: 'var(--text-muted)' }} />
          </a>
        ))}
        {files.length === 0 && (
          <p className="px-4 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>Keine Dateien gefunden.</p>
        )}
      </div>
    </Section>
  );
}

// ── Commits ───────────────────────────────────────────────────────────────────

function CommitList({ commits }: { commits: RepoCommit[] }) {
  return (
    <Section title="Commits" icon={GitCommit} count={commits.length}>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {commits.map(c => (
          <a
            key={c.sha}
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors"
            style={{ textDecoration: 'none' }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
              style={{ background: 'var(--accent-green)' }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{c.message}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                <span className="font-mono">{c.sha}</span>
                {' · '}{c.author}
                {' · '}{relTime(c.date)}
              </p>
            </div>
          </a>
        ))}
        {commits.length === 0 && (
          <p className="px-4 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>Keine Commits gefunden.</p>
        )}
      </div>
    </Section>
  );
}

// ── Branches ──────────────────────────────────────────────────────────────────

function BranchList({ branches, defaultBranch }: { branches: RepoBranch[]; defaultBranch: string }) {
  return (
    <Section title="Branches" icon={GitBranch} count={branches.length}>
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        {branches.map(b => (
          <div key={b.name} className="flex items-center gap-2.5 px-4 py-2.5">
            <GitBranch className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{b.name}</span>
            <div className="flex items-center gap-1.5">
              {b.name === defaultBranch && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--layer-3)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)' }}
                >
                  default
                </span>
              )}
              {b.protected && (
                <Shield className="w-3 h-3" style={{ color: 'var(--accent-amber)' }} />
              )}
            </div>
          </div>
        ))}
        {branches.length === 0 && (
          <p className="px-4 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>Keine Branches gefunden.</p>
        )}
      </div>
    </Section>
  );
}

// ── Pull Requests ─────────────────────────────────────────────────────────────

function PullRequestList({ prs }: { prs: PullRequest[] }) {
  return (
    <Section title="Offene Pull Requests" icon={GitPullRequest} count={prs.length}>
      {prs.length === 0 ? (
        <p className="px-4 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>Keine offenen Pull Requests.</p>
      ) : (
        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {prs.map(pr => (
            <a
              key={pr.number}
              href={pr.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors"
              style={{ textDecoration: 'none' }}
            >
              <span
                className="text-xs font-mono mt-0.5 flex-shrink-0"
                style={{ color: 'var(--accent-green)' }}
              >
                #{pr.number}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{pr.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {pr.author} · {relTime(pr.updatedAt)}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </Section>
  );
}

// ── README ─────────────────────────────────────────────────────────────────────

function ReadmePanel({ readme, repoUrl }: { readme: string | null; repoUrl: string }) {
  const preview = readme ? readme.slice(0, 1200) : null;
  const isTruncated = readme ? readme.length > 1200 : false;

  return (
    <Section title="README" icon={BookOpen}>
      {!readme ? (
        <p className="px-4 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>Kein README vorhanden.</p>
      ) : (
        <div className="px-4 py-3">
          <pre
            className="text-xs whitespace-pre-wrap break-words font-mono leading-relaxed"
            style={{ color: 'var(--text-secondary)', maxHeight: 320, overflow: 'hidden' }}
          >
            {preview}
            {isTruncated && '…'}
          </pre>
          {isTruncated && (
            <a
              href={`${repoUrl}#readme`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-xs hover:underline"
              style={{ color: 'var(--accent-blue)' }}
            >
              Vollständiges README auf GitHub <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </Section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function RepoDetailPage() {
  const params = useParams<{ owner: string; repo: string }>();
  const { owner, repo } = params;

  const [data, setData] = useState<RepoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!owner || !repo) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/github/repo/${owner}/${repo}`);
      const json = await res.json();
      if (!res.ok || json.error) throw new Error(json.error ?? 'Fehler beim Laden');
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setLoading(false);
    }
  }, [owner, repo]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-4 h-4 rounded animate-pulse" style={{ background: 'var(--layer-3)' }} />
          <div className="w-48 h-5 rounded animate-pulse" style={{ background: 'var(--layer-3)' }} />
        </div>
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            {[200, 400, 300].map((h, i) => (
              <div key={i} className="rounded-xl animate-pulse" style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', height: h }} />
            ))}
          </div>
          <div className="space-y-4">
            {[180, 240].map((h, i) => (
              <div key={i} className="rounded-xl animate-pulse" style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', height: h }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Link
          href="/repositories"
          className="inline-flex items-center gap-1.5 text-sm mb-4 hover:underline"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Zurück zu Repositories
        </Link>
        <div
          className="flex items-center gap-2 p-4 rounded-lg text-sm"
          style={{ background: 'var(--layer-2)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)' }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error ?? 'Repo nicht gefunden.'}
        </div>
      </div>
    );
  }

  const { repo: r, files, commits, branches, pullRequests, readme } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        <Link href="/repositories" className="hover:underline" style={{ color: 'var(--text-muted)' }}>
          Repositories
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span style={{ color: 'var(--text-secondary)' }}>{owner}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span style={{ color: 'var(--text-primary)' }}>{r.name}</span>
      </div>

      {/* Header */}
      <div
        className="rounded-xl p-5 mb-5"
        style={{ background: 'var(--layer-2)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {r.fullName}
              </h1>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: 'var(--layer-3)',
                  color: r.visibility === 'private' ? 'var(--text-muted)' : 'var(--accent-green)',
                  border: '1px solid var(--border)',
                }}
              >
                {r.visibility === 'private' ? (
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> privat</span>
                ) : (
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> public</span>
                )}
              </span>
            </div>
            {r.description && (
              <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>{r.description}</p>
            )}
            {r.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {r.topics.map(t => (
                  <span
                    key={t}
                    className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--layer-3)', color: 'var(--accent-blue)', border: '1px solid var(--border)' }}
                  >
                    <Tag className="w-2.5 h-2.5" />
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={load}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Neu laden"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: 'var(--text-primary)', border: '1px solid var(--border)' }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 text-xs" style={{ borderTop: '1px solid var(--border)', color: 'var(--text-muted)' }}>
          {r.language && (
            <span className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: LANG_COLORS[r.language] ?? 'var(--text-muted)' }}
              />
              {r.language}
            </span>
          )}
          {r.stars > 0 && (
            <span className="flex items-center gap-1" style={{ color: '#f59e0b' }}>
              <Star className="w-3.5 h-3.5" /> {r.stars}
            </span>
          )}
          {r.forks > 0 && (
            <span className="flex items-center gap-1">
              <GitFork className="w-3.5 h-3.5" /> {r.forks}
            </span>
          )}
          {r.openIssues > 0 && (
            <span className="flex items-center gap-1" style={{ color: 'var(--accent-amber)' }}>
              <AlertCircle className="w-3.5 h-3.5" /> {r.openIssues} Issues
            </span>
          )}
          <span className="flex items-center gap-1">
            <GitBranch className="w-3.5 h-3.5" /> {r.branch}
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Clock className="w-3.5 h-3.5" /> Push {relTime(r.pushedAt)} · erstellt {shortDate(r.createdAt)}
          </span>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Left column */}
        <div className="space-y-4 min-w-0">
          <FileTree files={files} />
          <CommitList commits={commits} />
          <PullRequestList prs={pullRequests} />
          <ReadmePanel readme={readme} repoUrl={r.url} />
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <QuickLinks repo={r} />
          <BranchList branches={branches} defaultBranch={r.branch} />
        </div>
      </div>
    </div>
  );
}
