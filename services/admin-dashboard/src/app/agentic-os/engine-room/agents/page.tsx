"use client";

import { FolderBrowser } from "@/components/FolderBrowser";
import { CrewLauncher } from "@/components/CrewLauncher";
import { CrewExecutionViewer } from "@/components/CrewExecutionViewer";
import { useState } from "react";

export default function AgentsPage() {
  const [executionId, setExecutionId] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">🤖 Engine Room — Agents</h1>
        <p className="text-xs text-slate-500 mt-1">03_Agents · Crew-Steuerung mit Dynamic Prompt Injection</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <CrewLauncher onExecutionStart={(id) => setExecutionId(id)} />
        </div>
        <div>
          {executionId ? (
            <CrewExecutionViewer executionId={executionId} />
          ) : (
            <div className="card p-6 text-center text-slate-600 text-sm">
              Crew starten um Execution zu sehen
            </div>
          )}
        </div>
      </div>

      <FolderBrowser category="agents" title="03_Agents" icon="🤖" />
    </div>
  );
}
