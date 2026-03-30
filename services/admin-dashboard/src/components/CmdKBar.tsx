'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Zap, LayoutDashboard, Workflow, BookOpen, BarChart2, Factory, Kanban, FileText, Settings, ExternalLink, ChevronRight } from 'lucide-react';
import { dashboardApiAuthHeaders } from '@/lib/dashboard-auth-headers';

interface SearchResult {
  id:       string;
  label:    string;
  sub?:     string;
  href:     string;
  icon:     React.ReactNode;
  external?: boolean;
  badge?:   string;
  badgeColor?: string;
}

// Static nav items always available
const NAV_ITEMS: SearchResult[] = [
  { id: 'nav-overview',    label: 'Overview',          href: '/',                          icon: <LayoutDashboard size={12} />,  badge: 'nav' },
  { id: 'nav-workflows',   label: 'Workflows',         href: '/workflows',                 icon: <Workflow        size={12} />,  badge: 'nav' },
  { id: 'nav-kanban',      label: 'Content Kanban',    href: '/kanban',                    icon: <Kanban          size={12} />,  badge: 'nav' },
  { id: 'nav-knowledge',   label: 'Knowledge',         href: '/knowledge',                 icon: <BookOpen        size={12} />,  badge: 'nav' },
  { id: 'nav-analytics',   label: 'Analytics',         href: '/analytics',                 icon: <BarChart2       size={12} />,  badge: 'nav' },
  { id: 'nav-templates',   label: 'Templates',         href: '/templates',                 icon: <FileText        size={12} />,  badge: 'nav' },
  { id: 'nav-content',     label: 'Content Factory',   href: '/content-factory',           icon: <Factory         size={12} />,  badge: 'nav' },
  { id: 'ext-n8n',         label: 'n8n öffnen',        href: 'https://n8n.automation-plus-ki.de',      icon: <Zap             size={12} />,  badge: 'ext', badgeColor: '#38bdf8', external: true },
  { id: 'ext-nocodb',      label: 'NocoDB öffnen',     href: 'https://nocodb.automation-plus-ki.de',  icon: <Settings size={12} />, badge: 'ext', badgeColor: '#fb923c', external: true },
  { id: 'ext-grafana',     label: 'Grafana öffnen',    href: 'https://grafana.automation-plus-ki.de', icon: <BarChart2 size={12} />, badge: 'ext', badgeColor: '#fbbf24', external: true },
];

// Quick triggers
const TRIGGERS: SearchResult[] = [
  { id: 'trig-trend',     label: 'Trigger: 11_TREND_MONITOR',        sub: 'n8n Workflow ausführen', href: '#trigger:fEYWN4pWhRcG2tLg',     icon: <Zap size={12} style={{ color: '#a78bfa' }} />, badge: 'run', badgeColor: '#a78bfa' },
  { id: 'trig-sentiment', label: 'Trigger: 12_SENTIMENT_TRACKER',    sub: 'n8n Workflow ausführen', href: '#trigger:Vx1Aea5glbogJxg6',     icon: <Zap size={12} style={{ color: '#38bdf8' }} />, badge: 'run', badgeColor: '#38bdf8' },
  { id: 'trig-content',   label: 'Trigger: 13_CONTENT_OPPORTUNITY',  sub: 'n8n Workflow ausführen', href: '#trigger:I6LcxlyMM8TU7A7V',     icon: <Zap size={12} style={{ color: '#34d399' }} />, badge: 'run', badgeColor: '#34d399' },
];

const ALL_STATIC = [...NAV_ITEMS, ...TRIGGERS];

export function CmdKBar() {
  const [open,    setOpen]    = useState(false);
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>(ALL_STATIC);
  const [active,  setActive]  = useState(0);
  const [running, setRunning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router   = useRouter();

  // Open on ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input when open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
      setQuery('');
      setActive(0);
    }
  }, [open]);

  // Search logic
  const search = useCallback(async (q: string) => {
    const lower = q.toLowerCase().trim();
    if (!lower) { setResults(ALL_STATIC); return; }

    const staticMatches = ALL_STATIC.filter(r =>
      r.label.toLowerCase().includes(lower) || (r.sub ?? '').toLowerCase().includes(lower)
    );

    // Also search NocoDB workflows
    try {
      const res  = await fetch(`/api/nocodb/table?id=mnwlsxsm0q1k2d2&limit=50`, { headers: { ...dashboardApiAuthHeaders() } });
      const data = await res.json() as unknown[] | { list?: unknown[] };
      const list = (Array.isArray(data) ? data : (data.list ?? [])) as Record<string, unknown>[];
      const wfMatches: SearchResult[] = list
        .filter(w => String(w.Name ?? '').toLowerCase().includes(lower))
        .slice(0, 5)
        .map(w => ({
          id:    `wf-${String(w.Id ?? Math.random())}`,
          label: String(w.Name ?? ''),
          sub:   `Workflow · ${String(w.Kategorie ?? '')} · ${String(w.Status ?? '')}`,
          href:  '/workflows',
          icon:  <Workflow size={12} />,
          badge: 'workflow', badgeColor: '#38bdf8',
        }));
      setResults([...staticMatches, ...wfMatches]);
    } catch {
      setResults(staticMatches);
    }
  }, []);

  useEffect(() => {
    setActive(0);
    search(query);
  }, [query, search]);

  const execute = useCallback(async (result: SearchResult) => {
    setOpen(false);

    if (result.href.startsWith('#trigger:')) {
      const wfId = result.href.replace('#trigger:', '');
      setRunning(result.id);
      try {
        await fetch(`/api/n8n/trigger/${wfId}`, {
          method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json', ...dashboardApiAuthHeaders() },
        });
      } catch { /* silent */ }
      setTimeout(() => setRunning(null), 1500);
      return;
    }

    if (result.external) {
      window.open(result.href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(result.href);
    }
  }, [router]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); }
    if (e.key === 'Enter' && results[active]) execute(results[active]);
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed', top: '18vh', left: '50%', transform: 'translateX(-50%)',
        width: 'min(580px, 92vw)', zIndex: 9999,
        background: 'var(--layer-1)', border: '1px solid var(--border-bright)',
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)',
      }}>
        {/* Search input */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 16px',
          borderBottom: '1px solid var(--border)',
        }}>
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Suchen — Workflows, Seiten, Trigger…"
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', fontSize: 14,
              color: 'var(--text-primary)', fontFamily: 'var(--font-ui)',
              caretColor: '#38bdf8',
            }}
          />
          <kbd style={{
            fontSize: 9, fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)', background: 'var(--layer-3)',
            padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)',
          }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: '6px 6px' }}>
          {results.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Keine Ergebnisse für &bdquo;{query}&ldquo;
            </div>
          ) : (
            results.map((r, idx) => (
              <div
                key={r.id}
                onClick={() => execute(r)}
                onMouseEnter={() => setActive(idx)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                  background: idx === active ? 'var(--layer-3)' : 'transparent',
                  transition: 'background 0.08s',
                }}
              >
                <span style={{ color: 'var(--text-muted)', flexShrink: 0, display: 'flex' }}>
                  {r.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-primary)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.label}
                    {running === r.id && ' ⚡ läuft…'}
                  </span>
                  {r.sub && (
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                      {r.sub}
                    </span>
                  )}
                </div>
                {r.badge && (
                  <span style={{
                    fontSize: 8, fontFamily: 'var(--font-mono)',
                    color: r.badgeColor ?? 'var(--text-muted)',
                    background: r.badgeColor ? `${r.badgeColor}18` : 'var(--layer-3)',
                    padding: '2px 6px', borderRadius: 4, flexShrink: 0,
                  }}>
                    {r.badge}
                  </span>
                )}
                {r.external ? (
                  <ExternalLink size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                ) : (
                  idx === active && <ChevronRight size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '7px 16px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          {[['↑↓', 'navigieren'], ['↵', 'öffnen'], ['⌘K', 'schließen']].map(([key, label]) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <kbd style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', background: 'var(--layer-3)', padding: '2px 5px', borderRadius: 3, border: '1px solid var(--border)' }}>
                {key}
              </kbd>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </>
  );
}
