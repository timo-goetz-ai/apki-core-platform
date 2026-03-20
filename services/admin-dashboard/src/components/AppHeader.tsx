'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Sun, Moon, Settings, Bell, FlaskConical, Command, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommandPalette } from '@/components/CommandPalette';
import { getRecentTemplates, type RecentTemplate } from '@/lib/template-engine';

export function AppHeader() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [commandOpen, setCommandOpen] = useState(false);
  const [recentTemplates, setRecentTemplates] = useState<RecentTemplate[]>([]);

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

          {/* Alerts */}
          <Button
            variant="ghost"
            size="icon"
            className="text-[--text-secondary] hover:text-[--text-primary] relative"
          >
            <Bell size={15} />
            <span
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--accent-red)' }}
            />
          </Button>

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
