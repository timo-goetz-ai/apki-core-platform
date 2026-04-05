export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getWorkflowIndex } from '@/lib/nocodb';

/**
 * GET /api/nocodb/workflows
 * Lädt Workflows aus NocoDB und mappt Spalten auf das Frontend-Interface.
 * NocoDB-Spalten → Frontend:
 *   n8n_id → WorkflowID, Kategorie → Layer, Zweck → Beschreibung,
 *   Intervall → Schedule, Notizen → Notes
 */
export async function GET() {
  try {
    const raw = await getWorkflowIndex();
    const workflows = raw.map((r: Record<string, unknown>) => ({
      Id: r.Id,
      WorkflowID: r.n8n_id ?? '',
      Name: r.Name ?? '',
      Status: r.Status ?? 'inaktiv',
      Layer: r.Kategorie ?? '',
      Beschreibung: r.Zweck ?? '',
      Schedule: r.Intervall ?? '',
      AI_Model: '',
      LastRun: null,
      Notes: r.Notizen ?? null,
      n8n_url: r.n8n_url ?? null,
    }));
    return NextResponse.json({ list: workflows });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fehler beim Laden der Workflows' },
      { status: 500 }
    );
  }
}
