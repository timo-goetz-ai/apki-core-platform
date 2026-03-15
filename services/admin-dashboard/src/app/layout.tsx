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
      <body className="min-h-screen bg-[#0a0f1a] text-slate-100">
        <nav className="sticky top-0 z-50 bg-[#0a0f1a]/90 backdrop-blur border-b border-[#1a2540] px-6 py-3 flex items-center gap-6">
          <span className="text-xs font-bold tracking-widest text-[#1d6ef5] uppercase">
            automation-plus-ki
          </span>
          <div className="flex items-center gap-1 ml-4">
            <Link
              href="/"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/mcp-stadt"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
            >
              🏙️ MCP-Stadt
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
