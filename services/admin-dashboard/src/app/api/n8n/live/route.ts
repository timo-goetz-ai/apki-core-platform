export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { inferCategory, inferScheduleTag } from '@/lib/workflow-categories';

const N8N_BASE = process.env.N8N_INTERNAL_URL ?? 'http://10.0.11.5:5678';
const N8N_KEY = process.env.N8N_API_KEY ?? process.env.N8N_SELF_API_KEY ?? '';

const DX_BASE = (process.env.DIRECTUS_URL ?? '').replace(/\/$/, '');
const DX_TOKEN = process.env.DIRECTUS_TOKEN ?? '';

interface N8nWf {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  createdAt?: string;
  nodes?: { type: string }[];
  tags?: { name: string }[];
}

interface N8nExec {
  id: string;
  workflowId?: string;
  status: string;
  startedAt: string;
  stoppedAt?: string;
  workflowData?: { name?: string };
}

interface DxWorkflow {
  id: number;
  n8n_id?: string;
  name?: string;
  Kategorie?: string;
  Intervall?: string;
  Zweck?: string;
  Status?: string;
}

export async function GET() {
  const headers: Record<string, string> = { 'X-N8N-API-KEY': N8N_KEY };

  const [wfRes, exRes, dxRes] = await Promise.allSettled([
    fetch(`${N8N_BASE}/api/v1/workflows?limit=100`, { headers, signal: AbortSignal.timeout(8000) }),
    fetch(`${N8N_BASE}/api/v1/executions?limit=50&includeData=false`, { headers, signal: AbortSignal.timeout(8000) }),
    DX_BASE && DX_TOKEN
      ? fetch(`${DX_BASE}/items/100_workflows?limit=-1&fields=id,n8n_id,name,Kategorie,Intervall,Zweck,Status`, {
          headers: { Authorization: `Bearer ${DX_TOKEN}` },
          signal: AbortSignal.timeout(6000),
        })
      : Promise.resolve(null),
  ]);

  // Parse n8n workflows
  const n8nWfs: N8nWf[] =
    wfRes.status === 'fulfilled' && wfRes.value?.ok
      ? ((await wfRes.value.json()).data ?? [])
      : [];

  // Parse n8n executions
  const executions: N8nExec[] =
    exRes.status === 'fulfilled' && exRes.value?.ok
      ? ((await exRes.value.json()).data ?? [])
      : [];

  // Parse Directus workflows
  let dxWfs: DxWorkflow[] = [];
  if (dxRes.status === 'fulfilled' && dxRes.value && 'ok' in dxRes.value && dxRes.value.ok) {
    const body = await (dxRes.value as Response).json();
    dxWfs = body.data ?? [];
  }

  // Build lookup: n8n_id → Directus data
  const dxMap = new Map<string, DxWorkflow>();
  for (const d of dxWfs) {
    if (d.n8n_id) dxMap.set(d.n8n_id, d);
  }

  // Merge workflows
  const workflows = n8nWfs.map((wf) => {
    const dx = dxMap.get(wf.id);
    const category = inferCategory(wf.name, dx?.Kategorie);
    const scheduleTag = inferScheduleTag(dx?.Intervall, wf.name);

    return {
      id: wf.id,
      name: wf.name,
      active: wf.active,
      updatedAt: wf.updatedAt,
      nodeCount: wf.nodes?.length ?? 0,
      tags: wf.tags?.map((t) => t.name) ?? [],
      // Enrichment
      categoryKey: category.key,
      categoryNr: category.nr,
      categoryLabel: category.label,
      categoryEmoji: category.emoji,
      scheduleTag: scheduleTag.key,
      scheduleLabel: scheduleTag.label,
      scheduleIcon: scheduleTag.icon,
      scheduleColor: scheduleTag.color,
      schedule: dx?.Intervall ?? '',
      description: dx?.Zweck ?? '',
      directusStatus: dx?.Status ?? '',
    };
  });

  // Execution stats
  const errorCount = executions.filter((e) => e.status === 'error' || e.status === 'failed').length;

  // Map executions with workflow names
  const recentExecs = executions.slice(0, 30).map((e) => {
    const wfName = e.workflowData?.name ?? n8nWfs.find((w) => w.id === e.workflowId)?.name ?? '?';
    return {
      id: e.id,
      workflowId: e.workflowId ?? '',
      workflowName: wfName,
      status: e.status,
      startedAt: e.startedAt,
      stoppedAt: e.stoppedAt ?? null,
    };
  });

  return NextResponse.json({
    workflows,
    executions: recentExecs,
    stats: {
      total: workflows.length,
      active: workflows.filter((w) => w.active).length,
      inactive: workflows.filter((w) => !w.active).length,
      errors: errorCount,
    },
    timestamp: new Date().toISOString(),
  });
}
