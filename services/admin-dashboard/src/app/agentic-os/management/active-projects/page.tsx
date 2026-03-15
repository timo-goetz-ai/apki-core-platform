import { FolderBrowser } from "@/components/FolderBrowser";

export default function ActiveProjectsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">📂 Active Projects</h1>
        <p className="text-xs text-slate-500 mt-1">02_Active_Projects — Aktiver Arbeitskontext</p>
      </div>
      <FolderBrowser category="active-projects" title="02_Active_Projects" icon="📂" />
    </div>
  );
}
