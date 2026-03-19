'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Sun, Moon, Settings, Bell, FlaskConical, Command, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlaygroundModal from '@/components/PlaygroundModal';
import { CommandPalette } from '@/components/CommandPalette';
import { getRecentTemplates, type RecentTemplate } from '@/lib/template-engine';

export function AppHeader() {
  const router = useRouter();
  const [isDark, setIsDark] = useState(true);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [recentTemplates, setRecentTemplates] = useState<RecentTemplate[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const dark = saved !== 'light';
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
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
          left: '220px',
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
          {/* Playground */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setPlaygroundOpen(true)}
            className="gap-1.5 text-[--text-secondary] hover:text-[--text-primary]"
          >
            <FlaskConical size={13} />
            <span className="hidden sm:inline">Playground</span>
          </Button>

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
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="text-[--text-secondary] hover:text-[--text-primary]"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon" asChild className="text-[--text-secondary] hover:text-[--text-primary]">
            <Link href="/settings">
              <Settings size={15} />
            </Link>
          </Button>
        </div>
      </header>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <PlaygroundModal isOpen={playgroundOpen} onClose={() => setPlaygroundOpen(false)} />
    </>
  );
}
