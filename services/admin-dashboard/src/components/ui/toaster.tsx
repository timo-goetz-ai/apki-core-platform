'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { toastStore } from '@/lib/toast-store';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

const ICONS = {
  success: <CheckCircle size={15} />,
  error:   <AlertCircle size={15} />,
  info:    <Info size={15} />,
  warning: <AlertTriangle size={15} />,
};

const COLORS = {
  success: { border: 'rgba(52,211,153,0.35)', icon: 'var(--accent-green)', bg: 'rgba(52,211,153,0.08)' },
  error:   { border: 'rgba(248,113,113,0.35)', icon: 'var(--accent-red)', bg: 'rgba(248,113,113,0.08)' },
  info:    { border: 'rgba(56,189,248,0.35)',  icon: 'var(--accent-blue)', bg: 'rgba(56,189,248,0.08)' },
  warning: { border: 'rgba(251,191,36,0.35)',  icon: 'var(--accent-amber)', bg: 'rgba(251,191,36,0.08)' },
};

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastStore.subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => {
        const c = COLORS[t.type];
        return (
          <div
            key={t.id}
            style={{
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              borderRadius: 10,
              background: 'var(--layer-1)',
              border: `1px solid ${c.border}`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
              minWidth: 260,
              maxWidth: 360,
              animation: 'toastIn 0.18s ease',
            }}
          >
            <style>{`@keyframes toastIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            <span style={{ color: c.icon, flexShrink: 0, marginTop: 1 }}>{ICONS[t.type]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</p>
              {t.message && (
                <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{t.message}</p>
              )}
            </div>
            <button
              onClick={() => toastStore.remove(t.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
              }}
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
