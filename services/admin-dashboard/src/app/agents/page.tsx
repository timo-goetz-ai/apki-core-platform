'use client';

import { ExternalLink, Bot, Construction } from 'lucide-react';

export default function AgentsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1.5 flex items-center gap-2.5">
          <span className="text-2xl">🤖</span> Agenten-Fabrik
        </h1>
        <p className="text-sm text-slate-400">Verwaltung und Orchestrierung von KI-Agenten</p>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-8 max-w-xl flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Construction size={24} className="text-amber-400" />
        </div>
        <div>
          <p className="text-base font-semibold text-slate-100 mb-1">Agenten-Management wird aufgebaut</p>
          <p className="text-sm text-slate-400 leading-relaxed">
            Die Agenten-Fabrik wird gerade entwickelt. Verwalte deine KI-Agenten aktuell direkt über NocoDB.
          </p>
        </div>
        <a
          href="https://nocodb.automation-plus-ki.de"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium no-underline"
        >
          <Bot size={14} />
          NocoDB AI_SYSTEM öffnen
          <ExternalLink size={12} className="text-blue-500" />
        </a>
      </div>
    </div>
  );
}
