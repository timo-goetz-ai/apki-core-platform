'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, Sun, Moon, Settings, ChevronDown, FlaskConical } from 'lucide-react';
import { useLLM, LLM_MODELS } from '@/lib/llm-context';
import PlaygroundModal from '@/components/PlaygroundModal';

export default function TopBar() {
  const { model, setModel } = useLLM();
  const [isDark, setIsDark] = useState(true);
  const [modelOpen, setModelOpen] = useState(false);
  const [playgroundOpen, setPlaygroundOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const dark = saved !== 'light';
    setIsDark(dark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, []);

  useEffect(() => {
    const close = () => setModelOpen(false);
    if (modelOpen) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [modelOpen]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const currentModel = LLM_MODELS.find((m) => m.id === model);

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
          <a
            href="https://Bruno.automation-plus-ki.de"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors no-underline"
          >
            Bruno
          </a>

          {/* Playwright */}
          <a
            href="https://playwright.automation-plus-ki.de"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors no-underline"
          >
            Playwright
          </a>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* LLM Model selector */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setModelOpen((o) => !o); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-slate-800 border border-slate-700/50 text-slate-200 hover:border-slate-600 transition-colors"
            >
              <span className="text-amber-400">⚡</span>
              <span className="hidden sm:inline">{currentModel?.label ?? model}</span>
              <ChevronDown size={11} className={`text-slate-400 transition-transform ${modelOpen ? 'rotate-180' : ''}`} />
            </button>

            {modelOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50">
                {LLM_MODELS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setModel(m.id); setModelOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                      m.id === model
                        ? 'bg-blue-500/15 text-blue-300'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                    }`}
                  >
                    <span>{m.label}</span>
                    <span className="text-xs text-slate-500">{m.provider}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

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
