export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { assertFabrikHook } from '@/lib/fabrik-internal';
import { purgeFabrikFromQdrant } from '@/lib/fabrik-purge';

/**
 * POST /api/fabrik/hooks/purge
 * Body: { qdrant_point_id?: string, snapshot_key?: string, actor?: string }
 */
export async function POST(req: NextRequest) {
  const denied = assertFabrikHook(req);
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => ({}));
    const result = await purgeFabrikFromQdrant({
      qdrant_point_id: body.qdrant_point_id ? String(body.qdrant_point_id) : undefined,
      snapshot_key: body.snapshot_key ? String(body.snapshot_key) : undefined,
      actor: body.actor ? String(body.actor) : 'n8n-fabrik-purge',
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
