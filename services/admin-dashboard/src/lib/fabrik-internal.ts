import { NextRequest, NextResponse } from 'next/server';

export function fabrikHookRejectUnauthorized(): NextResponse {
  return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
}

/**
 * Interne Webhooks (n8n, Coolify): Header `x-fabrik-webhook-token: <FABRIK_INTERNAL_WEBHOOK_TOKEN>`
 * oder `Authorization: Bearer <token>`.
 */
export function assertFabrikHook(req: NextRequest): NextResponse | null {
  const expected = process.env.FABRIK_INTERNAL_WEBHOOK_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'FABRIK_INTERNAL_WEBHOOK_TOKEN ist nicht gesetzt' },
      { status: 503 }
    );
  }
  const header = req.headers.get('x-fabrik-webhook-token')?.trim();
  const auth = req.headers.get('authorization');
  const bearer = auth?.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  const token = header || bearer;
  if (token !== expected) return fabrikHookRejectUnauthorized();
  return null;
}
