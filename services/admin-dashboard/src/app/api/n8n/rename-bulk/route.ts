/**
 * POST /api/n8n/rename-bulk
 *
 * Renames all workflows in n8n to the new schema:
 *   [SchemaID] — [DisplayName]
 *   e.g. "17_020_AI — Trend Monitor"
 *
 * Safe to run multiple times (idempotent).
 * Webhook URLs are ID-based and are NOT affected by name changes.
 */
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { WORKFLOW_CATALOG } from '@/lib/workflow-categories';

const N8N_BASE = process.env.N8N_INTERNAL_URL ?? 'http://10.0.1.16:5678';
const N8N_KEY  = process.env.N8N_API_KEY ?? process.env.N8N_SELF_API_KEY ?? '';

interface RenameResult {
  n8nId:   string;
  newName: string;
  ok:      boolean;
  error?:  string;
}

export async function POST() {
  const headers: Record<string, string> = {
    'X-N8N-API-KEY': N8N_KEY,
    'Content-Type':  'application/json',
  };

  const results: RenameResult[] = [];

  for (const entry of WORKFLOW_CATALOG) {
    // Format: "17_020_AI — Trend Monitor"
    const newName = `${entry.newId} — ${entry.displayName}`;

    try {
      // First fetch the current workflow to get its full data (required for PUT)
      const getRes = await fetch(`${N8N_BASE}/api/v1/workflows/${entry.n8nId}`, {
        headers,
        signal: AbortSignal.timeout(8000),
      });

      if (!getRes.ok) {
        results.push({ n8nId: entry.n8nId, newName, ok: false, error: `GET ${getRes.status}` });
        continue;
      }

      const wfData = await getRes.json();

      // Skip if already named correctly
      if (wfData.name === newName) {
        results.push({ n8nId: entry.n8nId, newName, ok: true });
        continue;
      }

      // PUT with only allowed fields (n8n API v1 rejects extra properties)
      const ALLOWED_SETTINGS = new Set([
        'executionOrder','saveManualExecutions','saveExecutionProgress',
        'saveDataErrorExecution','saveDataSuccessExecution','callerPolicy',
        'errorWorkflow','timezone',
      ]);
      const filteredSettings = Object.fromEntries(
        Object.entries(wfData.settings ?? {}).filter(([k]) => ALLOWED_SETTINGS.has(k))
      );
      const putBody = {
        name:        newName,
        nodes:       wfData.nodes,
        connections: wfData.connections,
        settings:    filteredSettings,
        staticData:  wfData.staticData ?? null,
      };
      const putRes = await fetch(`${N8N_BASE}/api/v1/workflows/${entry.n8nId}`, {
        method:  'PUT',
        headers,
        body:    JSON.stringify(putBody),
        signal:  AbortSignal.timeout(10000),
      });

      if (putRes.ok) {
        results.push({ n8nId: entry.n8nId, newName, ok: true });
      } else {
        const errText = await putRes.text().catch(() => '');
        results.push({ n8nId: entry.n8nId, newName, ok: false, error: `PUT ${putRes.status}: ${errText.slice(0, 80)}` });
      }
    } catch (err) {
      results.push({ n8nId: entry.n8nId, newName, ok: false, error: String(err).slice(0, 80) });
    }
  }

  const renamed = results.filter((r) => r.ok).length;
  const failed  = results.filter((r) => !r.ok).length;

  return NextResponse.json({
    ok:      failed === 0,
    renamed,
    failed,
    results,
    timestamp: new Date().toISOString(),
  });
}
