export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { inferCategory, inferScheduleTag, getCatalogEntry } from '@/lib/workflow-categories';

const N8N_BASE = process.env.N8N_INTERNAL_URL ?? 'http://10.0.1.16:5678';
const N8N_KEY  = process.env.N8N_API_KEY ?? process.env.N8N_SELF_API_KEY ?? '';

const DX_BASE  = (process.env.DIRECTUS_URL ?? '').replace(/\/$/, '');
const DX_TOKEN = process.env.DIRECTUS_TOKEN ?? '';

/* ── n8n types ────────────────────────────────────────────────────────────── */
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

/* ── Directus type — field names are ALL lowercase ────────────────────────── */
interface DxWorkflow {
  id: number;
  n8n_id?: string;
  name?: string;
  /** Lowercase — bug fix: previous code used Kategorie (uppercase) */
  kategorie?: string;
  intervall?: string;
  zweck?: string;
  status?: string;
  kosten?: string;
  prioritaet?: string;
  trigger?: string;
}

export async function GET() {
  const n8nHeaders: Record<string, string> = { 'X-N8N-API-KEY': N8N_KEY };

  const [wfRes, exRes, dxRes] = await Promise.allSettled([
    fetch(`${N8N_BASE}/api/v1/workflows?limit=100`, {
      headers: n8nHeaders,
      signal: AbortSignal.timeout(8000),
    }),
    fetch(`${N8N_BASE}/api/v1/executions?limit=50&includeData=false`, {
      headers: n8nHeaders,
      signal: AbortSignal.timeout(8000),
    }),
    DX_BASE && DX_TOKEN
      ? fetch(
          `${DX_BASE}/items/100_workflows?limit=-1` +
          `&fields=id,n8n_id,name,kategorie,intervall,zweck,status,kosten,prioritaet,trigger`,
          {
            headers: { Authorization: `Bearer ${DX_TOKEN}` },
            signal: AbortSignal.timeout(6000),
          },
        )
      : Promise.resolve(null),
  ]);

  /* Parse n8n workflows */
  const n8nWfs: N8nWf[] =
    wfRes.status === 'fulfilled' && wfRes.value?.ok
      ? ((await wfRes.value.json()).data ?? [])
      : [];

  /* Parse n8n executions */
  const executions: N8nExec[] =
    exRes.status === 'fulfilled' && exRes.value?.ok
      ? ((await exRes.value.json()).data ?? [])
      : [];

  /* Parse Directus workflows */
  let dxWfs: DxWorkflow[] = [];
  if (dxRes.status === 'fulfilled' && dxRes.value && 'ok' in dxRes.value && dxRes.value.ok) {
    const body = await (dxRes.value as Response).json();
    dxWfs = body.data ?? [];
  }

  /* Build lookup: n8n_id → Directus row */
  const dxMap = new Map<string, DxWorkflow>();
  for (const d of dxWfs) {
    if (d.n8n_id) dxMap.set(d.n8n_id, d);
  }

  /*
   * Build combined workflow list.
   * Source of truth: union of n8n (live active-state) + Directus (metadata).
   * Workflows that exist in Directus but NOT in n8n are included as inactive.
   */
  const n8nIds = new Set(n8nWfs.map((w) => w.id));

  // Add Directus-only entries (not yet in n8n or deleted)
  const dxOnlyWfs: N8nWf[] = dxWfs
    .filter((d) => d.n8n_id && !n8nIds.has(d.n8n_id))
    .map((d) => ({
      id: d.n8n_id!,
      name: d.name ?? d.n8n_id!,
      active: false,
      updatedAt: new Date().toISOString(),
      nodes: [],
      tags: [],
    }));

  const allWfs = [...n8nWfs, ...dxOnlyWfs];

  const workflows = allWfs.map((wf) => {
    const dx      = dxMap.get(wf.id);
    const catalog = getCatalogEntry(wf.id);

    /* Category: catalog → Directus → name-pattern */
    const catKey   = catalog?.categoryKey ?? dx?.kategorie;
    const category = inferCategory(wf.name, catKey);

    /* Schedule: catalog → Directus → name-pattern */
    const scheduleStr = catalog?.runFrequency ?? dx?.intervall;
    const finalScheduleTag = inferScheduleTag(scheduleStr, wf.name);

    return {
      id:             wf.id,
      name:           wf.name,
      active:         wf.active,
      updatedAt:      wf.updatedAt,
      nodeCount:      wf.nodes?.length ?? 0,
      tags:           wf.tags?.map((t) => t.name) ?? [],
      // New schema
      newId:          catalog?.newId ?? '',
      displayName:    catalog?.displayName ?? wf.name,
      chips:          catalog?.chips ?? [],
      // Category
      categoryKey:    category.key,
      categoryNr:     category.nr,
      categoryLabel:  category.label,
      categoryEmoji:  category.emoji,
      // Schedule
      scheduleTag:    finalScheduleTag.key,
      scheduleLabel:  finalScheduleTag.label,
      scheduleIcon:   finalScheduleTag.icon,
      scheduleColor:  finalScheduleTag.color,
      schedule:       catalog?.runFrequency ?? dx?.intervall ?? '',
      // Enrichment
      description:    catalog?.description ?? dx?.zweck ?? '',
      benefit:        catalog?.benefit ?? '',
      savesHoursPerWeek: catalog?.savesHoursPerWeek ?? 0,
      cost:           dx?.kosten ?? 'kostenlos',
      priority:       dx?.prioritaet ?? 'mittel',
      directusStatus: dx?.status ?? '',
      inDevelopment:  catalog?.inDevelopment ?? false,
      n8nUrl:         `https://n8n.automation-plus-ki.de/workflow/${wf.id}`,
    };
  });

  /* Sort: by category nr, then by new ID */
  workflows.sort((a, b) => {
    if (a.categoryNr !== b.categoryNr) return a.categoryNr - b.categoryNr;
    return (a.newId || a.name).localeCompare(b.newId || b.name);
  });

  /* Execution stats */
  const errorCount = executions.filter(
    (e) => e.status === 'error' || e.status === 'failed',
  ).length;

  const wfNameMap = new Map(n8nWfs.map((w) => [w.id, w.name]));
  const recentExecs = executions.slice(0, 30).map((e) => ({
    id:           e.id,
    workflowId:   e.workflowId ?? '',
    workflowName: e.workflowData?.name ?? wfNameMap.get(e.workflowId ?? '') ?? '?',
    status:       e.status,
    startedAt:    e.startedAt,
    stoppedAt:    e.stoppedAt ?? null,
  }));

  return NextResponse.json({
    workflows,
    executions: recentExecs,
    stats: {
      total:    workflows.length,
      active:   workflows.filter((w) => w.active).length,
      inactive: workflows.filter((w) => !w.active).length,
      errors:   errorCount,
      savesHoursPerWeek: workflows.reduce((s, w) => s + (w.savesHoursPerWeek ?? 0), 0),
    },
    timestamp: new Date().toISOString(),
  });
}
