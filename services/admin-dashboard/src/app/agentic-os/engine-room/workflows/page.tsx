import { FolderBrowser } from "@/components/FolderBrowser";

export default function WorkflowsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">⚡ Engine Room — Workflows</h1>
        <p className="text-xs text-slate-500 mt-1">10_Workflows — n8n & Automation-Pipelines</p>
      </div>
      <FolderBrowser category="workflows" title="10_Workflows" icon="⚡" />
    </div>
  );
}
