/**
 * AIOS Central Action API
 *
 * Used by both the UI and Raycast AI / external triggers.
 * All actions follow one interface — no duplicate logic.
 *
 * POST /api/actions
 * Body: { intent: string, params?: Record<string, unknown> }
 *
 * Raycast AI example:
 *   "Restart n8n" → POST /api/actions { intent: "restart_service", params: { name: "n8n" } }
 *   "Show dashboard" → POST /api/actions { intent: "navigate", params: { path: "/" } }
 *   "Run workflow X" → POST /api/actions { intent: "run_workflow", params: { id: "..." } }
 *
 * GET /api/actions → returns command registry (intent list)
 */

import { NextRequest, NextResponse } from 'next/server';
import { COMMAND_REGISTRY, type CommandDef } from '@/lib/action-registry';

// ── Types ──────────────────────────────────────────────────────────────────────
interface ActionResult {
  ok: boolean;
  intent: string;
  result?: unknown;
  navigate?: string;
  error?: string;
}

// Intent → navigate map
const NAV_MAP: Record<string, string> = Object.fromEntries(
  COMMAND_REGISTRY
    .filter((c): c is CommandDef & { navigate: string } => 'navigate' in c)
    .map(c => [c.intent, (c as CommandDef & { navigate: string }).navigate])
);

// ── GET — return registry ──────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json({
    version: '1.0',
    description: 'AIOS Central Action API — used by UI and Raycast AI',
    commands: COMMAND_REGISTRY,
    total: COMMAND_REGISTRY.length,
  });
}

// ── POST — execute action ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  let body: { intent?: string; params?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const { intent, params = {} } = body;
  if (!intent) return NextResponse.json({ ok: false, error: 'intent required' }, { status: 400 });

  const result = await executeAction(intent, params);
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

// ── Action executor ────────────────────────────────────────────────────────────
async function executeAction(intent: string, params: Record<string, unknown>): Promise<ActionResult> {

  // Navigation intents — return target path for UI to handle
  if (intent in NAV_MAP) {
    return { ok: true, intent, navigate: NAV_MAP[intent], result: { path: NAV_MAP[intent] } };
  }

  switch (intent) {

    // ── Deployments ──
    case 'get_deployments': {
      const baseUrl = process.env.COOLIFY_URL;
      const apiKey  = process.env.COOLIFY_API_KEY;
      if (!baseUrl || !apiKey) return { ok: false, intent, error: 'Coolify not configured' };
      const [appsRes, svcsRes] = await Promise.allSettled([
        fetch(`${baseUrl}/api/v1/applications`, { headers: { Authorization: `Bearer ${apiKey}` } }).then(r => r.json()),
        fetch(`${baseUrl}/api/v1/services`,     { headers: { Authorization: `Bearer ${apiKey}` } }).then(r => r.json()),
      ]);
      const apps = appsRes.status === 'fulfilled' ? appsRes.value : [];
      const svcs = svcsRes.status === 'fulfilled' ? svcsRes.value : [];
      return { ok: true, intent, result: { total: apps.length + svcs.length, apps, services: svcs } };
    }

    case 'deploy_app':
    case 'restart_app': {
      const uuid   = params.uuid as string;
      const action = intent === 'deploy_app' ? 'deploy' : 'restart';
      if (!uuid) return { ok: false, intent, error: 'uuid required' };
      const baseUrl = process.env.COOLIFY_URL;
      const apiKey  = process.env.COOLIFY_API_KEY;
      if (!baseUrl || !apiKey) return { ok: false, intent, error: 'Coolify not configured' };
      const res = await fetch(`${baseUrl}/api/v1/applications/${uuid}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      });
      return { ok: res.ok, intent, result: { uuid, action, status: res.status } };
    }

    // ── Workflows ──
    case 'list_workflows': {
      const NOCO_TOKEN = process.env.NOCODB_API_TOKEN ?? '';
      const NOCO_BASE  = process.env.NOCODB_AI_SYSTEM_BASE_ID ?? '';
      const NOCO_URL   = process.env.NOCODB_URL ?? 'https://nocodb.automation-plus-ki.de';
      const TABLE      = process.env.NOCODB_WORKFLOWS_TABLE_ID ?? 'mnwlsxsm0q1k2d2';
      try {
        const res = await fetch(
          `${NOCO_URL}/api/v1/db/data/noco/${NOCO_BASE}/${TABLE}?limit=50`,
          { headers: { 'xc-token': NOCO_TOKEN } }
        );
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.list ?? []);
        return {
          ok: true, intent,
          result: {
            total: list.length,
            active: list.filter((w: { Status: string }) => w.Status === 'aktiv').length,
            workflows: list.map((w: { Name: string; Status: string; Kategorie: string; n8n_id: string }) => ({ name: w.Name, status: w.Status, kategorie: w.Kategorie, id: w.n8n_id })),
          },
        };
      } catch (e) {
        return { ok: false, intent, error: String(e) };
      }
    }

    // ── Monitoring ──
    case 'get_service_status': {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/services`);
        const data = await res.json();
        return { ok: true, intent, result: data };
      } catch (e) {
        return { ok: false, intent, error: String(e) };
      }
    }

    case 'get_logs': {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/nocodb/error-logs`);
        const data = await res.json();
        return { ok: true, intent, result: data };
      } catch (e) {
        return { ok: false, intent, error: String(e) };
      }
    }

    // ── AI ──
    case 'ask_ai': {
      const message = params.message as string;
      if (!message) return { ok: false, intent, error: 'message required' };
      // Forward to chat API (non-streaming, simple response)
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ role: 'user', content: message }],
            modelKey: 'auto',
            stream: false,
          }),
        });
        const text = await res.text();
        return { ok: true, intent, result: { response: text } };
      } catch (e) {
        return { ok: false, intent, error: String(e) };
      }
    }

    default:
      return { ok: false, intent, error: `Unknown intent: "${intent}". GET /api/actions for registry.` };
  }
}
