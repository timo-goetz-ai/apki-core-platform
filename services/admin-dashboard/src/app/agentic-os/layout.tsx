"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type CategoryItem = {
  label: string;
  href: string;
  folder: string;
  icon: string;
  apiCategory: string;
};

type Category = {
  label: string;
  icon: string;
  color: string;
  items: CategoryItem[];
};

const NAV: Category[] = [
  {
    label: "Management",
    icon: "🎯",
    color: "text-sky-400",
    items: [
      { label: "AI Ops", href: "/agentic-os/management/ai-ops", folder: "01_AI_Ops", icon: "⚙️", apiCategory: "ai-ops" },
      { label: "Active Projects", href: "/agentic-os/management/active-projects", folder: "02_Active_Projects", icon: "📂", apiCategory: "active-projects" },
    ],
  },
  {
    label: "Engine Room",
    icon: "🔧",
    color: "text-amber-400",
    items: [
      { label: "Agents", href: "/agentic-os/engine-room/agents", folder: "03_Agents", icon: "🤖", apiCategory: "agents" },
      { label: "Workflows", href: "/agentic-os/engine-room/workflows", folder: "10_Workflows", icon: "⚡", apiCategory: "workflows" },
    ],
  },
  {
    label: "Knowledge Assets",
    icon: "📚",
    color: "text-emerald-400",
    items: [
      { label: "Prompt Library", href: "/agentic-os/knowledge/prompts", folder: "07_Prompt_Library", icon: "✍️", apiCategory: "prompts" },
      { label: "Templates", href: "/agentic-os/knowledge/templates", folder: "08_Templates", icon: "📋", apiCategory: "templates" },
    ],
  },
  {
    label: "Monitoring",
    icon: "📊",
    color: "text-purple-400",
    items: [
      { label: "Automations", href: "/agentic-os/monitoring/automations", folder: "04_Automations", icon: "🔄", apiCategory: "automations" },
      { label: "Dashboards", href: "/agentic-os/monitoring/dashboards", folder: "05_Dashboards", icon: "🖥️", apiCategory: "dashboards" },
    ],
  },
];

function useFolderCount(apiCategory: string) {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    fetch(`/api/agentic-os/${apiCategory}`)
      .then((r) => r.json())
      .then((d) => setCount(d.total ?? null))
      .catch(() => setCount(null));
  }, [apiCategory]);
  return count;
}

function NavItem({ item }: { item: CategoryItem }) {
  const pathname = usePathname();
  const active = pathname === item.href;
  const count = useFolderCount(item.apiCategory);

  return (
    <Link
      href={item.href}
      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors group ${
        active
          ? "bg-[#1d6ef5]/15 text-[#1d6ef5] border border-[#1d6ef5]/30"
          : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
      }`}
    >
      <span className="flex items-center gap-2">
        <span>{item.icon}</span>
        <span className="font-medium">{item.label}</span>
      </span>
      {count !== null && count > 0 && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-[#1d6ef5]/20 text-[#1d6ef5]" : "bg-[#1a2540] text-slate-500"}`}>
          {count}
        </span>
      )}
    </Link>
  );
}

export default function AgenticOSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-[#1a2540] bg-[#070b14] sticky top-[49px] h-[calc(100vh-49px)] overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Branding */}
          <div className="px-1 pt-1">
            <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase">Agentic OS</p>
            <p className="text-[10px] text-slate-700 mt-0.5 font-mono">03_ai-agent-platform</p>
          </div>

          {/* Overview Link */}
          <Link
            href="/agentic-os"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
          >
            <span>🗺️</span>
            <span className="font-medium">Cockpit</span>
          </Link>

          {/* Categories */}
          {NAV.map((cat) => (
            <div key={cat.label} className="space-y-1">
              <p className={`px-1 text-[10px] font-bold uppercase tracking-widest ${cat.color} mb-2`}>
                {cat.icon} {cat.label}
              </p>
              {cat.items.map((item) => (
                <NavItem key={item.href} item={item} />
              ))}
            </div>
          ))}

          {/* MCP-Plattform Link */}
          <div className="border-t border-[#1a2540] pt-4">
            <Link
              href="/mcp-plattform"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
            >
              <span>⚙️</span>
              <span>MCP-Plattform</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
