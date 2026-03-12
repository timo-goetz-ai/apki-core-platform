"use client";

import { useEffect, useState } from "react";

type Crew = {
  id: string;
  name: string;
  agents: number;
  tasks: number;
};

type Props = {
  onExecutionStart: (executionId: string) => void;
};

export function CrewLauncher({ onExecutionStart }: Props) {
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCrew, setSelectedCrew] = useState<string>("");
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [starting, setStarting] = useState(false);

  const fetchCrews = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/crews/");
      const data = await r.json();
      setCrews(Array.isArray(data) ? data : []);
      const list = Array.isArray(data) ? data : [];
      if (list.length && !selectedCrew) {
        setSelectedCrew(list[0].id);
      }
    } catch {
      setCrews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrews();
  }, []);

  const startCrew = async () => {
    if (!selectedCrew) return;
    setStarting(true);
    try {
      const r = await fetch(`/api/crews/${selectedCrew}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      const data = await r.json();
      const executionId = data?.execution_id;
      if (executionId) {
        onExecutionStart(executionId);
      }
    } catch (e) {
      console.error("Start crew failed:", e);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-500">Lade Crews...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-lg font-semibold">Crew starten</h2>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Crew
        </label>
        <select
          value={selectedCrew}
          onChange={(e) => setSelectedCrew(e.target.value)}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        >
          <option value="">— Auswählen —</option>
          {crews.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.agents} Agents, {c.tasks} Tasks)
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Topic (Input)
        </label>
        <input
          type="text"
          placeholder="z.B. KI-Management"
          value={inputs.topic ?? ""}
          onChange={(e) => setInputs((prev) => ({ ...prev, topic: e.target.value }))}
          className="w-full rounded border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
        />
      </div>

      <button
        onClick={startCrew}
        disabled={!selectedCrew || starting}
        className="rounded bg-zinc-900 px-4 py-2 text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {starting ? "Starte…" : "Crew starten"}
      </button>
    </div>
  );
}
