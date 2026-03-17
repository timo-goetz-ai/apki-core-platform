'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Cpu } from 'lucide-react';
import { useLLM, LLM_MODELS } from '@/lib/llm-context';

export default function ModelBar() {
  const { model, setModel } = useLLM();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const close = () => setOpen(false);
    if (open) document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const current = LLM_MODELS.find((m) => m.id === model);

  return (
    <div
      className="fixed top-[52px] left-0 right-0 z-40 h-[38px] flex items-center px-4 gap-3"
      style={{
        background: 'rgba(15,23,42,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(51,65,85,0.4)',
        paddingLeft: '256px',  /* sidebar (240) + 16px gap */
      }}
    >
      {/* Label */}
      <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1.5">
        <Cpu size={11} />
        Aktives Modell
      </span>

      {/* Model picker */}
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          className="flex items-center gap-2 px-2.5 py-1 rounded-md text-xs bg-slate-800/70 border border-slate-700/50 text-slate-200 hover:border-blue-500/50 hover:text-blue-300 transition-colors"
        >
          <span className="text-amber-400 text-[10px]">⚡</span>
          {current?.label ?? model}
          <ChevronDown size={10} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 top-[calc(100%+4px)] w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-1.5 z-50">
            {LLM_MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => { setModel(m.id); setOpen(false); }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs transition-colors ${
                  m.id === model
                    ? 'bg-blue-500/15 text-blue-300'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                }`}
              >
                <span>{m.label}</span>
                <span className="text-slate-500">{m.provider}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status pill */}
      <span className="flex items-center gap-1.5 text-[10px] text-emerald-400">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        bereit
      </span>
    </div>
  );
}
