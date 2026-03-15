import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, unauthorizedResponse } from "@/lib/auth";
import { pushEvent } from "@/lib/activity-store";

export const dynamic = "force-dynamic";

/**
 * N8N Workflow Webhooks Store & Trigger
 * GET  /api/n8n/webhooks  – Liste konfigurierter Webhooks
 * POST /api/n8n/webhooks  – Webhook auslösen
 */

interface N8NWebhook {
  id: string;
  name: string;
  url: string;
  method: "GET" | "POST";
  payload?: Record<string, unknown>;
  description?: string;
}

// In-memory config (in Production: aus DB oder config.yml laden)
const g = globalThis as typeof globalThis & { __n8nWebhooks?: N8NWebhook[] };
if (!g.__n8nWebhooks) {
  g.__n8nWebhooks = ([
    {
      id: "daily-report",
      name: "Daily Report",
      url: process.env.N8N_WEBHOOK_DAILY_REPORT ?? "",
      method: "POST" as const,
      description: "Tages-Report per E-Mail versenden",
      payload: { trigger: "manual", source: "dashboard" },
    },
    {
      id: "deploy-notify",
      name: "Deploy Notification",
      url: process.env.N8N_WEBHOOK_DEPLOY_NOTIFY ?? "",
      method: "POST" as const,
      description: "Slack-Nachricht bei neuem Deployment",
      payload: { trigger: "manual", source: "dashboard" },
    },
  ] as N8NWebhook[]).filter(w => w.url);
}

export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) return unauthorizedResponse();

  return NextResponse.json({
    webhooks: (g.__n8nWebhooks ?? []).map(w => ({
      id: w.id, name: w.name, method: w.method, description: w.description,
      configured: !!w.url,
    })),
  });
}

export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) return unauthorizedResponse();

  const { webhookId, extraPayload } = await request.json();
  const hook = (g.__n8nWebhooks ?? []).find(w => w.id === webhookId);
  if (!hook) return NextResponse.json({ error: "Webhook nicht gefunden" }, { status: 404 });
  if (!hook.url) return NextResponse.json({ error: "Webhook URL nicht konfiguriert" }, { status: 503 });

  try {
    const res = await fetch(hook.url, {
      method: hook.method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...hook.payload, ...extraPayload, triggeredAt: new Date().toISOString() }),
      signal: AbortSignal.timeout(10_000),
    });
    pushEvent("n8n-trigger", `N8N: ${hook.name}`, res.ok ? "ausgelöst" : `Fehler ${res.status}`, res.ok);
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch (e) {
    pushEvent("n8n-trigger", `N8N: ${hook.name}`, String(e), false);
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
