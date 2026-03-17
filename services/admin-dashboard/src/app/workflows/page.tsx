'use client';

import { ExternalLink } from 'lucide-react';

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 52px)' }}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-700/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <span className="text-sm font-semibold text-slate-100">n8n Workflows</span>
        </div>
        <a
          href="https://n8n.automation-plus-ki.de"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors no-underline"
        >
          Öffnen
          <ExternalLink size={11} />
        </a>
      </div>
      {/* iFrame */}
      <iframe
        src="https://n8n.automation-plus-ki.de"
        className="w-full flex-1 border-0"
        style={{ height: 'calc(100vh - 52px - 41px)' }}
        title="n8n Workflows"
      />
    </div>
  );
}
