'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Sun, Moon, Settings, Bell, FlaskConical, Command, FileText, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommandPalette } from '@/components/CommandPalette';
import { getRecentTemplates, type RecentTemplate } from '@/lib/template-engine';

interface Alert {
  name: string;
  severity: 'critical' | 'warning' | 'info';
  state: 'firing' | 'pending';
  summary: string;
  startsAt: string;
}

const ALERT_ICON = {
  critical: <AlertCircle size={12} />,
  warning:  <AlertTriangle size={12} />,
  info:     <Info size={12} />,
};

const ALERT_COLOR = {
  critical: '#f87171',
  warning:  '#fbbf24',
  info:     '#38bdf8',
};

export function AppHeader() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [recentTemplates, setRecentTemplates] = useState<RecentTemplate[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/monitoring/alerts');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const id = setInterval(fetchAlerts, 60_000);
    return () => clearInterval(id);
  }, [fetchAlerts]);

  // Close bell dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    let dark: boolean;
    if (saved === 'light') {
      dark = false;
    } else if (saved === 'dark') {
      dark = true;
    } else {
      // System preference detection
      dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');

    // Listen for system preference changes
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const refresh = () => setRecentTemplates(getRecentTemplates());
    refresh();
    window.addEventListener('aios:templates:updated', refresh);
    return () => window.removeEventListener('aios:templates:updated', refresh);
  }, []);

  // Cmd+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <>
      <header
        className="fixed top-0 right-0 z-30 flex h-[60px] items-center gap-3 px-4"
        style={{
          left: '240px',
          background: 'var(--layer-1)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {/* Command palette search trigger */}
        <button
          onClick={() => setCommandOpen(true)}
          className="flex flex-1 max-w-sm items-center gap-2 rounded-md border border-[--border] bg-[--layer-2] px-3 py-2 text-sm text-[--text-muted] transition-colors hover:border-[--border-bright] hover:text-[--text-secondary]"
        >
          <Search size={13} className="shrink-0" />
          <span className="flex-1 text-left">Suchen oder navigieren...</span>
          <kbd className="flex items-center gap-1 rounded border border-[--border-bright] bg-[--layer-3] px-1.5 py-0.5 font-mono text-[10px] text-[--text-muted]">
            <Command size={9} />K
          </kbd>
        </button>

        {/* Quick-access templates */}
        {recentTemplates.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5">
            <FileText size={12} className="text-[--text-muted] shrink-0" />
            {recentTemplates.slice(0, 5).map(t => (
              <button
                key={t.id}
                onClick={() => router.push('/templates')}
                title={t.name}
                className="max-w-[100px] truncate rounded border border-[--border] bg-[--layer-2] px-2 py-1 text-[10px] text-[--text-muted] hover:text-[--text-primary] hover:border-[--border-bright] transition-colors"
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Workspace */}
          <Link href="/claude-workspace">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-[--text-secondary] hover:text-[--text-primary]"
            >
              <FlaskConical size={13} />
              <span className="hidden sm:inline">Workspace</span>
            </Button>
          </Link>

          {/* Alerts bell */}
          <div ref={bellRef} style={{ position: 'relative' }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setBellOpen(o => !o)}
              className="text-[--text-secondary] hover:text-[--text-primary] relative"
            >
              <Bell size={15} />
              {alerts.length > 0 && (
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
                  style={{ background: alerts.some(a => a.severity === 'critical') ? 'var(--accent-red)' : '#fbbf24' }}
                />
              )}
            </Button>

            {bellOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: 320,
                background: 'var(--layer-1)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                zIndex: 200,
                overflow: 'hidden',
              }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                    Alerts {alerts.length > 0 ? `(${alerts.length})` : ''}
                  </span>
                  <button onClick={() => setBellOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                    <X size={13} />
                  </button>
                </div>
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {alerts.length === 0 ? (
                    <div style={{ padding: '24px 14px', textAlign: 'center' }}>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>Keine aktiven Alerts</p>
                    </div>
                  ) : alerts.map((a, i) => {
                    const color = ALERT_COLOR[a.severity];
                    return (
                      <div key={i} style={{
                        padding: '10px 14px',
                        borderBottom: i < alerts.length - 1 ? '1px solid var(--border)' : 'none',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 9,
                      }}>
                        <span style={{ color, flexShrink: 0, marginTop: 2 }}>{ALERT_ICON[a.severity]}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</p>
                          {a.summary && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>{a.summary}</p>}
                        </div>
                        <span style={{ fontSize: 10, color, flexShrink: 0, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{a.severity}</span>
                      </div>
                    );
                  })}
                </div>
                {alerts.length > 0 && (
                  <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
                    <Link href="/monitoring/grafana" onClick={() => setBellOpen(false)} style={{ fontSize: 11, color: 'var(--accent-blue)', textDecoration: 'none' }}>
                      Grafana öffnen →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDark ? 'Light Mode aktivieren' : 'Dark Mode aktivieren'}
            title={isDark ? 'Light Mode' : 'Dark Mode'}
            className="relative flex h-8 w-14 items-center rounded-full border border-[--border-bright] bg-[--layer-3] p-0.5 transition-all hover:border-[--accent-blue]/40"
            style={{ flexShrink: 0 }}
          >
            {/* Track icons */}
            <span className="absolute left-1.5 flex items-center text-[--accent-amber]">
              <Sun size={11} />
            </span>
            <span className="absolute right-1.5 flex items-center text-[--text-muted]">
              <Moon size={11} />
            </span>
            {/* Thumb */}
            <span
              className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full shadow-sm transition-all duration-300"
              style={{
                background: isDark ? 'var(--layer-1)' : 'var(--accent-blue)',
                transform: isDark ? 'translateX(24px)' : 'translateX(0)',
                boxShadow: isDark
                  ? '0 1px 4px rgba(0,0,0,0.5)'
                  : '0 1px 4px rgba(2,132,199,0.4)',
              }}
            >
              {isDark
                ? <Moon size={10} className="text-[--accent-blue]" />
                : <Sun size={10} className="text-white" />
              }
            </span>
          </button>

          {/* Settings */}
          <Button variant="ghost" size="icon" asChild className="text-[--text-secondary] hover:text-[--text-primary]">
            <Link href="/settings">
              <Settings size={15} />
            </Link>
          </Button>
        </div>
      </header>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </>
  );
}
