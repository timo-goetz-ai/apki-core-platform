'use client';

import { DockerControlWidget } from '@/components/DockerControlWidget';

export default function ContainersPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1.5 flex items-center gap-2.5">
          <span className="text-2xl">🐳</span> Container
        </h1>
        <p className="text-sm text-slate-400">Docker Container-Verwaltung und -Monitoring</p>
      </div>
      <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4">
        <DockerControlWidget />
      </div>
    </div>
  );
}
