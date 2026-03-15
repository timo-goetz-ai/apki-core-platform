import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "automation-plus-ki Dashboard",
  description: "Central control panel",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-[#070b14] text-slate-100">
        <nav className="sticky top-0 z-50 bg-[#070b14]/90 backdrop-blur border-b border-[#1a2540] px-6 py-2.5 flex items-center gap-4">

          {/* Logo */}
          <span className="text-xs font-bold tracking-widest text-[#1d6ef5] uppercase shrink-0">
            automation-plus-ki
          </span>

          {/* Tool-Pills — Playwright & Bruno */}
          <div className="flex items-center gap-1.5 border-l border-[#1a2540] pl-4">
            <a
              href="https://playwright.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="tool-pill"
              title="Playwright — E2E Testing"
            >
              <span className="text-[10px]">🎭</span>
              Playwright
            </a>
            <a
              href="/agentic-os/management/ai-ops"
              className="tool-pill"
              title="Bruno API Tests — 01_APIs/02_bruno-api-tests"
            >
              <span className="text-[10px]">🐻</span>
              Bruno
            </a>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Main Nav */}
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/agentic-os"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            >
              🗺️ Agentic OS
            </Link>
            <Link
              href="/mcp-plattform"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            >
              ⚙️ MCP-Plattform
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
