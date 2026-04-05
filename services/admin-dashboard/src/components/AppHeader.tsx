'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Sun, Moon, Settings, Bell, AlertCircle, AlertTriangle, Info, X, Menu, ChevronDown, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PROVIDER_META, type ModelProvider } from '@/lib/chat-models';

type AiosMode = 'orchestrator' | ModelProvider;

const MODE_OPTIONS: { key: AiosMode; label: string; color: string }[] = [
  { key: 'orchestrator', label: 'Orchestrator', color: '#60a5fa' },
  { key: 'anthropic',    label: 'Claude',       color: PROVIDER_META.anthropic.color },
  { key: 'google',       label: 'Gemini',       color: PROVIDER_META.google.color },
  { key: 'openrouter',   label: 'OpenRouter',   color: PROVIDER_META.openrouter.color },
];

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
  critical: 'var(--accent-red)',
  warning:  'var(--accent-amber)',
  info:     'var(--accent-blue)',
} as const;

export function AppHeader({ onOpenMobileNav }: { onOpenMobileNav?: () => void } = {}) {
  const [isDark, setIsDark] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const [aiosMode, setAiosMode] = useState<AiosMode>('orchestrator');
  const [modeOpen, setModeOpen] = useState(false);
  const modeRef = useRef<HTMLDivElement>(null);

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

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) {
        setModeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load saved mode from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('aios-mode') as AiosMode | null;
    if (saved && MODE_OPTIONS.some(o => o.key === saved)) {
      setAiosMode(saved);
    }
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


  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <>
      <header
        className="fixed top-0 right-0 z-30 flex h-[60px] items-center gap-2 border-b border-[--border] bg-[--layer-1] px-2 pl-2 lg:left-[240px] lg:pl-4 left-0"
      >
        {onOpenMobileNav ? (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-[--text-secondary] transition-colors hover:bg-[--layer-3] hover:text-[--text-primary] lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--layer-1)]"
            aria-label="Menü öffnen"
          >
            <Menu size={20} strokeWidth={2} />
          </button>
        ) : null}
        <div className="flex-1" />

        {/* Right actions */}
        <div className="flex items-center gap-1">
          {/* Mode Selector */}
          <div ref={modeRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setModeOpen(o => !o)}
              className="flex min-h-[36px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-[--border-bright]"
              style={{
                borderColor: MODE_OPTIONS.find(o => o.key === aiosMode)?.color ?? 'var(--border)',
                color: MODE_OPTIONS.find(o => o.key === aiosMode)?.color ?? 'var(--text-secondary)',
                background: 'var(--layer-2)',
              }}
            >
              <Zap size={11} />
              <span className="hidden sm:inline">{MODE_OPTIONS.find(o => o.key === aiosMode)?.label}</span>
              <ChevronDown size={11} style={{ opacity: 0.6 }} />
            </button>

            {modeOpen && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                width: 180,
                background: 'var(--layer-1)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                zIndex: 200,
                overflow: 'hidden',
              }}>
                {MODE_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => {
                      setAiosMode(opt.key);
                      localStorage.setItem('aios-mode', opt.key);
                      setModeOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs transition-colors hover:bg-[--layer-3]"
                    style={{
                      color: aiosMode === opt.key ? opt.color : 'var(--text-secondary)',
                      fontWeight: aiosMode === opt.key ? 600 : 400,
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: opt.color }}
                    />
                    {opt.label}
                    {opt.key === 'orchestrator' && (
                      <span style={{ marginLeft: 'auto', fontSize: 9, opacity: 0.5 }}>AUTO</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

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
                  style={{ background: alerts.some(a => a.severity === 'critical') ? 'var(--accent-red)' : 'var(--accent-amber)' }}
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

    </>
  );
}
