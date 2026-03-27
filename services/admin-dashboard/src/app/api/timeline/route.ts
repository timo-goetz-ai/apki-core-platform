export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const NOCODB_URL   = process.env.NOCODB_URL ?? 'https://nocodb.automation-plus-ki.de';
const NOCODB_TOKEN = process.env.NOCODB_API_TOKEN ?? '';
const PROJECT_ID   = process.env.NOCODB_AI_SYSTEM_BASE_ID ?? 'pfx0ca6docorj8n';
const N8N_URL      = process.env.N8N_URL ?? 'http://10.0.1.29:5678';
const N8N_TOKEN    = process.env.N8N_API_KEY ?? '';

export type TimelineEventType =
  | 'workflow_success'
  | 'workflow_error'
  | 'content_generated'
  | 'content_approved'
  | 'content_discarded'
  | 'content_published'
  | 'content_pending'
  | 'error_log'
  | 'deploy';

export interface TimelineAction {
  label: string;
  href?: string;
  api?: string;
  method?: string;
  body?: Record<string, unknown>;
  variant: 'primary' | 'danger' | 'ghost';
}

export interface TimelineEvent {
  id: string;
  ts: string;
  type: TimelineEventType;
  source: string;
  title: string;
  description?: string;
  status: 'success' | 'error' | 'warning' | 'info' | 'pending';
  meta?: Record<string, string | number | boolean | null>;
  actions?: TimelineAction[];
  confidence?: number;
}

async function fetchNocoDB(tableId: string, params = '') {
  const url = `${NOCODB_URL}/api/v1/db/data/noco/${PROJECT_ID}/${tableId}?limit=20&sort=-CreatedAt${params}`;
  const res = await fetch(url, {
    headers: { 'xc-token': NOCODB_TOKEN },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data?.list ?? [];
}

async function fetchN8NExecutions(): Promise<TimelineEvent[]> {
  try {
    const res = await fetch(`${N8N_URL}/api/v1/executions?limit=20&includeData=false`, {
      headers: { 'X-N8N-API-KEY': N8N_TOKEN },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const executions = data?.data ?? [];

    return executions.map((ex: Record<string, unknown>) => {
      const finished   = ex.stoppedAt as string ?? ex.startedAt as string;
      const isError    = ex.status === 'error';
      const wfName     = (ex.workflowData as Record<string, unknown>)?.name as string ?? 'Workflow';

      const event: TimelineEvent = {
        id:     `n8n-${ex.id}`,
        ts:     finished,
        type:   isError ? 'workflow_error' : 'workflow_success',
        source: 'n8n',
        title:  wfName,
        description: isError
          ? `Fehler nach ${Math.round(((ex.stoppedAt ? new Date(ex.stoppedAt as string).getTime() : Date.now()) - new Date(ex.startedAt as string).getTime()) / 1000)}s`
          : `${Math.round(((ex.stoppedAt ? new Date(ex.stoppedAt as string).getTime() : Date.now()) - new Date(ex.startedAt as string).getTime()) / 1000)}s`,
        status: isError ? 'error' : 'success',
        meta: { workflowId: ex.workflowId as string },
        actions: isError ? [{ label: 'In n8n öffnen', href: `${N8N_URL}/workflow/${ex.workflowId}`, variant: 'ghost' }] : [],
      };
      return event;
    });
  } catch {
    return [];
  }
}

async function fetchContentPipeline(): Promise<TimelineEvent[]> {
  try {
    const rows = await fetchNocoDB('m48nvpornrxuba9');
    return rows.map((row: Record<string, unknown>) => {
      const status   = row.status as string ?? 'pending_approval';
      const tone     = row.tone as string ?? '';
      const topic    = row.topic as string ?? 'Unbekanntes Thema';
      const score    = row.confidence_score as number | null;

      let type: TimelineEventType = 'content_pending';
      let evtStatus: TimelineEvent['status'] = 'pending';
      if (status === 'approved')   { type = 'content_approved';   evtStatus = 'success'; }
      if (status === 'discarded')  { type = 'content_discarded';  evtStatus = 'warning'; }
      if (status === 'published')  { type = 'content_published';  evtStatus = 'success'; }
      if (status === 'pending_approval') { type = 'content_pending'; evtStatus = 'pending'; }

      const actions: TimelineAction[] = [];
      if (status === 'pending_approval') {
        actions.push({ label: '✅ Freigeben',  api: `/api/nocodb/update?table=m48nvpornrxuba9&id=${row.Id}`, method: 'PATCH', body: { status: 'approved' }, variant: 'primary' });
        actions.push({ label: '🗑️ Verwerfen', api: `/api/nocodb/update?table=m48nvpornrxuba9&id=${row.Id}`, method: 'PATCH', body: { status: 'discarded' }, variant: 'danger' });
      }

      return {
        id:          `content-${row.Id}`,
        ts:          row.CreatedAt as string ?? new Date().toISOString(),
        type,
        source:      'Content Pipeline',
        title:       topic,
        description: tone ? `Variante: ${tone}` : undefined,
        status:      evtStatus,
        confidence:  score ?? undefined,
        meta:        { tone, target: row.target_platforms as string ?? 'LinkedIn', stage: row.stage as string },
        actions,
      } as TimelineEvent;
    });
  } catch {
    return [];
  }
}

async function fetchErrorLogs(): Promise<TimelineEvent[]> {
  try {
    const rows = await fetchNocoDB('mgnxselg5bkglr8');
    return rows
      .filter((r: Record<string, unknown>) => r.level === 'error' || r.level === 'critical')
      .slice(0, 10)
      .map((row: Record<string, unknown>) => ({
        id:          `error-${row.Id}`,
        ts:          row.ts as string ?? row.CreatedAt as string,
        type:        'error_log' as TimelineEventType,
        source:      row.service as string ?? 'System',
        title:       row.message as string ?? 'Fehler',
        description: row.details as string ?? undefined,
        status:      row.level === 'critical' ? 'error' : 'warning',
        meta:        { resolved: row.resolved as boolean },
      } as TimelineEvent));
  } catch {
    return [];
  }
}

export async function GET() {
  const [n8nEvents, contentEvents, errorEvents] = await Promise.allSettled([
    fetchN8NExecutions(),
    fetchContentPipeline(),
    fetchErrorLogs(),
  ]);

  const all: TimelineEvent[] = [
    ...(n8nEvents.status === 'fulfilled'      ? n8nEvents.value      : []),
    ...(contentEvents.status === 'fulfilled'  ? contentEvents.value  : []),
    ...(errorEvents.status === 'fulfilled'    ? errorEvents.value    : []),
  ];

  // Sort descending by timestamp
  all.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  return NextResponse.json({ events: all.slice(0, 60) });
}
