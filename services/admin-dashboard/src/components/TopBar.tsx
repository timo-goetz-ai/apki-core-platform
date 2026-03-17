'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, Sun, Moon, Settings, FlaskConical } from 'lucide-react';
import PlaygroundModal from '@/components/PlaygroundModal';

export default function TopBar() {
  const [isDark, setIsDark] = useState(true);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const dark = saved !== 'light';
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-[52px] bg-slate-900/80 backdrop-blur border-b border-slate-700/50 flex items-center px-4 gap-3">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-100 no-underline flex-shrink-0 mr-2"
        >
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
            <Zap size={12} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-sm tracking-tight">AIOS</span>
        </Link>

        {/* Nav actions */}
        <div className="flex items-center gap-1">
          {/* Playground */}
          <button
            onClick={() => setPlaygroundOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <FlaskConical size={13} />
            Playground
          </button>

          {/* Bruno */}
          <Link
            href="/tools"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors no-underline"
          >
            Bruno
          </Link>

          {/* Playwright */}
          <Link
            href="/tools"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors no-underline"
          >
            Playwright
          </Link>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50 transition-colors"
          >
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </button>

          {/* Settings */}
          <Link
            href="/settings"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50 transition-colors"
          >
            <Settings size={13} />
          </Link>
        </div>
      </header>

      <PlaygroundModal isOpen={playgroundOpen} onClose={() => setPlaygroundOpen(false)} />
    </>
  );
}
