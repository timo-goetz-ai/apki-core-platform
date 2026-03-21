export interface PromSnapshot {
  targets?: Array<{
    labels?: { job?: string; instance?: string };
    health?: string;
  }>;
  up?: Array<{
    metric?: Record<string, string>;
    value?: [number, string];
  }>;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** 0–1 aus Prometheus-Targets/`up`-Samples, pro Service-ID (Health-Check-Key). */
export function promMatchStrength(serviceId: string, prom: PromSnapshot | null): number {
  if (!prom) return 0;
  const nid = norm(serviceId);
  if (!nid) return 0;
  let best = 0;

  for (const t of prom.targets ?? []) {
    const job = norm(t.labels?.job ?? '');
    const inst = norm(t.labels?.instance ?? '');
    if (!job && !inst) continue;
    const hit =
      job.includes(nid) ||
      nid.includes(job) ||
      inst.includes(nid) ||
      nid.split(/(?=[A-Z])/).some((p) => p && (job.includes(norm(p)) || inst.includes(norm(p))));
    if (!hit) continue;
    const h = (t.health ?? '').toLowerCase();
    const v = h === 'up' ? 1 : h === 'unknown' ? 0.45 : 0.12;
    if (v > best) best = v;
  }

  for (const u of prom.up ?? []) {
    const blob = norm(JSON.stringify(u.metric ?? {}));
    if (!blob.includes(nid)) continue;
    const val = parseFloat(String(u.value?.[1] ?? '0'));
    if (val >= 1) best = Math.max(best, 1);
    else if (val > 0) best = Math.max(best, 0.35);
  }

  return best;
}

export function buildPromGlowMap(serviceIds: string[], prom: PromSnapshot | null): Record<string, number> {
  const m: Record<string, number> = {};
  for (const id of serviceIds) {
    m[id] = promMatchStrength(id, prom);
  }
  return m;
}
