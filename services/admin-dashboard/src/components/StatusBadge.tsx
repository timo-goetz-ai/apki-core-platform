const colors: Record<string, string> = {
  idle:      "bg-slate-700 text-slate-300",
  running:   "bg-sky-900 text-sky-300 animate-pulse",
  error:     "bg-red-900 text-red-300",
  healthy:   "bg-emerald-900 text-emerald-300",
  pending:   "bg-yellow-900 text-yellow-300",
  completed: "bg-emerald-900 text-emerald-300",
  queued:    "bg-blue-900 text-blue-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-medium ${colors[status] ?? "bg-slate-700 text-slate-400"}`}>
      {status}
    </span>
  );
}
