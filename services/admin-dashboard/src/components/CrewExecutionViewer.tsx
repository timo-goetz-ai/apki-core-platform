"use client";

import { useCrewStream } from "@/hooks/useCrewStream";

type Props = {
  executionId: string;
};

export function CrewExecutionViewer({ executionId }: Props) {
  const { events, isConnected } = useCrewStream(executionId);

  const lastEvent = events[events.length - 1];
  const status =
    lastEvent?.type === "execution_completed"
      ? "completed"
      : lastEvent?.type === "execution_error"
        ? "error"
        : "running";

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Execution</h2>
          <p className="font-mono text-sm text-zinc-500">{executionId}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${
              isConnected ? "bg-emerald-500" : "bg-zinc-400"
            }`}
          />
          <span className="text-sm text-zinc-600">
            {isConnected ? "Live" : "Disconnected"}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              status === "completed"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                : status === "error"
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Task Timeline
        </h3>
        <ul className="space-y-1">
          {events
            .filter(
              (e) =>
                e.type === "task_started" ||
                e.type === "task_completed" ||
                e.type === "execution_started" ||
                e.type === "execution_completed"
            )
            .map((e, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span
                  className={
                    e.type === "task_completed" || e.type === "execution_completed"
                      ? "text-emerald-600"
                      : "text-zinc-500"
                  }
                >
                  {e.type === "task_started" || e.type === "task_completed"
                    ? "●"
                    : "▶"}
                </span>
                <span className="font-mono text-zinc-600 dark:text-zinc-400">
                  {String(e.type)}
                </span>
                {"task_id" in e && (
                  <span className="text-zinc-500">({String(e.task_id)})</span>
                )}
              </li>
            ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Raw Event Log
        </h3>
        <pre className="max-h-64 overflow-auto rounded bg-zinc-100 p-3 font-mono text-xs dark:bg-zinc-800">
          {events.length === 0
            ? "Waiting for events..."
            : events.map((e, i) => JSON.stringify(e)).join("\n")}
        </pre>
      </div>
    </div>
  );
}
