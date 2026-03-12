const BASE = process.env.NEXT_PUBLIC_NEXUS_API_URL ?? "http://localhost:8000";

export async function fetchHealth() {
  const res = await fetch(`${BASE}/health`, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error("nexus-core unreachable");
  return res.json();
}

export async function fetchAgents() {
  const res = await fetch(`${BASE}/api/agents`, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error("agents fetch failed");
  return res.json();
}

export async function fetchTasks() {
  const res = await fetch(`${BASE}/api/tasks`, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error("tasks fetch failed");
  return res.json();
}

export async function fetchPrompts() {
  const res = await fetch(`${BASE}/api/prompts`, { next: { revalidate: 0 } });
  if (!res.ok) throw new Error("prompts fetch failed");
  return res.json();
}

export type Agent = {
  id: string;
  name: string;
  model: string;
  status: "idle" | "running" | "error";
};

export type Task = {
  id: string;
  title: string;
  description: string;
  agent_id: string;
  priority: string;
  status: string;
  created_at: string;
};
