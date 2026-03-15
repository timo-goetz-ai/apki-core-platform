import { FolderBrowser } from "@/components/FolderBrowser";

export default function AIopsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">⚙️ AI Ops</h1>
        <p className="text-xs text-slate-500 mt-1">01_AI_Ops — Betrieb & Orchestrierung</p>
      </div>
      <FolderBrowser category="ai-ops" title="01_AI_Ops" icon="⚙️" />
    </div>
  );
}
