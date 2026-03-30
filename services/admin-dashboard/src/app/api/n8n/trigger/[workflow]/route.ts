import { NextRequest, NextResponse } from 'next/server';
import { unauthorizedResponse, verifyApiKey } from '@/lib/auth';

const N8N_BASE = (process.env.N8N_BASE_URL ?? 'https://n8n.automation-plus-ki.de').replace(/\/$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY ?? '';

// Triggers a specific workflow by ID or name via n8n webhook
export async function POST(
  req: NextRequest,
  { params }: { params: { workflow: string } }
) {
  if (!verifyApiKey(req)) return unauthorizedResponse();

  if (!N8N_API_KEY) {
    return NextResponse.json({ ok: false, error: 'N8N_API_KEY ist nicht konfiguriert' }, { status: 503 });
  }

  const { workflow } = params;
  const body = await req.json().catch(() => ({}));

  try {
    const res = await fetch(`${N8N_BASE}/webhook/${workflow}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const text = await res.text();
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      workflow,
      response: text,
      triggered: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
