'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Cpu, Zap } from 'lucide-react';
import { useLLM, LLM_MODELS } from '@/lib/llm-context';

const MODEL_TAGS: Record<string, { tag: string; color: string }> = {
  'claude-3-5-sonnet':      { tag: 'SMART', color: '#a78bfa' },
  'claude-3-haiku':         { tag: 'FAST',  color: '#34d399' },
  'deepseek/deepseek-chat': { tag: 'FREE',  color: '#fbbf24' },
  'gpt-4o':                 { tag: 'SMART', color: '#a78bfa' },
  'gemini-1.5-pro':         { tag: 'FAST',  color: '#34d399' },
};

export default function ModelBar() {
  const { model, setModel } = useLLM();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    if (open) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const current = LLM_MODELS.find(m => m.id === model);
  const tag = MODEL_TAGS[model];

  return (
    <div style={{
      position: 'fixed', top: 52, left: 0, right: 0, zIndex: 40,
      height: 38, display: 'flex', alignItems: 'center',
      paddingLeft: 256, paddingRight: 24, gap: 16,
      background: 'rgba(13,17,23,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border)',
    }}>

      {/* Label */}
      <span style={{
        fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 500,
        color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Cpu size={9} />
        Aktives Modell
      </span>

      {/* Selector */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '3px 10px', borderRadius: 6, cursor: 'pointer',
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', fontSize: 12,
            fontFamily: 'var(--font-mono)', transition: 'border-color 0.14s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-blue)'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'}
        >
          <Zap size={10} style={{ color: 'var(--accent-amber)' }} />
          {current?.label ?? model}
          {tag && (
            <span style={{
              fontSize: 8, fontWeight: 700, letterSpacing: '0.06em',
              padding: '1px 5px', borderRadius: 3,
              background: `${tag.color}20`, color: tag.color,
            }}>
              {tag.tag}
            </span>
          )}
          <ChevronDown
            size={10}
            style={{
              color: 'var(--text-muted)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
            }}
          />
        </button>

        {open && (
          <div style={{
            position: 'absolute', left: 0, top: 'calc(100% + 6px)',
            width: 270, background: 'var(--layer-2)',
            border: '1px solid var(--border-bright)',
            borderRadius: 12, padding: 6, zIndex: 50,
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          }}>
            {LLM_MODELS.map(m => {
              const t = MODEL_TAGS[m.id];
              const isSelected = m.id === model;
              return (
                <button
                  key={m.id}
                  onClick={() => { setModel(m.id); setOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '8px 10px',
                    borderRadius: 8, cursor: 'pointer', marginBottom: 2,
                    background: isSelected ? 'rgba(56,189,248,0.08)' : 'transparent',
                    border: isSelected ? '1px solid rgba(56,189,248,0.2)' : '1px solid transparent',
                    color: isSelected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    fontSize: 12, fontFamily: 'var(--font-mono)',
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'var(--layer-3)'; el.style.color = 'var(--text-primary)'; } }}
                  onMouseLeave={e => { if (!isSelected) { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'transparent'; el.style.color = 'var(--text-secondary)'; } }}
                >
                  <span>{m.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {t && (
                      <span style={{
                        fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                        background: `${t.color}20`, color: t.color, letterSpacing: '0.06em',
                      }}>
                        {t.tag}
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.provider}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Status pill */}
      <span style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 9, fontFamily: 'var(--font-mono)',
        color: 'var(--accent-green)',
      }}>
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: 'var(--accent-green)',
          animation: 'glow-pulse 2s ease-in-out infinite',
        }} />
        bereit
      </span>
    </div>
  );
}
