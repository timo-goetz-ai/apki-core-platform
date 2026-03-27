// src/app/page.tsx
"use client";

import { SummaryBar } from "@/components/SummaryBar";
import { ServiceGrid } from "@/components/ServiceGrid";
import { RefreshCw, Zap } from "lucide-react";
import { useSWRConfig } from "swr";
import { useState } from "react";

export default function DashboardPage() {
  const { mutate } = useSWRConfig();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    await mutate(() => true, undefined, { revalidate: true });
    setTimeout(() => setRefreshing(false), 600);
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Top Nav */}
      <header className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-fuchsia-500/10 p-1.5 border border-fuchsia-500/20">
              <Zap className="h-4 w-4 text-fuchsia-400" />
            </div>
            <div>
              <span className="font-mono text-sm font-bold tracking-tight text-zinc-100">
                KI-Flow
              </span>
              <span className="ml-2 font-mono text-xs text-zinc-500">
                / infra
              </span>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 font-mono text-xs text-zinc-400 transition-all hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh all
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-[1400px] space-y-6 px-6 py-8">
        {/* Summary */}
        <SummaryBar />

        {/* Service Grid */}
        <ServiceGrid />
      </div>
    </main>
  );
}
