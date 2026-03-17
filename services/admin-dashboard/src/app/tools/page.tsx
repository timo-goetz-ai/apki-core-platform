'use client';

import { MCPHealthDashboard } from '@/components/MCPHealthDashboard';

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1.5 flex items-center gap-2.5">
          <span className="text-2xl">🔧</span> Tools & Skills
        </h1>
        <p className="text-sm text-slate-400">MCP-Server Health und Tool-Übersicht</p>
      </div>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <MCPHealthDashboard />
      </div>
    </div>
  );
}
