import { CheckCircle2, LayoutDashboard } from "lucide-react";
import { MacProjectsWidget } from "@/components/MacProjectsWidget";
import { DockerControlWidget } from "@/components/DockerControlWidget";
import { CloudflareWidget } from "@/components/CloudflareWidget";
import { CoolifyWidget } from "@/components/CoolifyWidget";
import { GitHubStatsWidget } from "@/components/GitHubStatsWidget";
import { CorporatePromptWidget } from "@/components/CorporatePromptWidget";
import { N8NWidget } from "@/components/N8NWidget";
import { ActivityFeedWidget } from "@/components/ActivityFeedWidget";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6 space-y-8">

      {/* Header */}
      <div className="flex items-center gap-3">
        <LayoutDashboard className="text-sky-400 w-7 h-7" />
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      </div>

      {/* Mac — Lokale Projekte & Docker */}
      <section>
        <SectionLabel>Mac – Lokal</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MacProjectsWidget />
          <DockerControlWidget />
        </div>
      </section>

      {/* Infrastruktur — Cloudflare & Coolify */}
      <section>
        <SectionLabel>Infrastruktur</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CloudflareWidget />
          <CoolifyWidget />
        </div>
      </section>

      {/* GitHub & Corporate Prompts */}
      <section>
        <SectionLabel>GitHub & Prompts</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GitHubStatsWidget />
          <CorporatePromptWidget />
        </div>
      </section>

      {/* Automationen & Activity */}
      <section>
        <SectionLabel>Automationen & Aktivität</SectionLabel>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <N8NWidget />
          <ActivityFeedWidget />
        </div>
      </section>

      <footer className="text-center text-xs text-slate-600 pt-4">
        automation-plus-ki.de
      </footer>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
      {children}
    </h2>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center py-10 text-slate-600 text-sm">
      <CheckCircle2 className="w-4 h-4 mr-2" /> {text}
    </div>
  );
}

