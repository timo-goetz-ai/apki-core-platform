export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { indexFabrikToVectorAndNoco } from '@/lib/fabrik-index';

/**
 * POST /api/fabrik/index
 * Body: { title, owner?, description?, notes?, snapshot_key? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = String(body.title ?? '').trim();
    if (!title) {
      return NextResponse.json({ error: 'title ist Pflicht' }, { status: 400 });
    }
    const result = await indexFabrikToVectorAndNoco({
      title,
      owner: body.owner ? String(body.owner) : undefined,
      description: body.description ? String(body.description) : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      snapshot_key: body.snapshot_key ? String(body.snapshot_key) : undefined,
    });
    return NextResponse.json({
      ok: true,
      reindexed: result.reindexed,
      nocodb_extended: result.nocodb_extended,
      qdrant_collection: result.qdrant_collection,
      qdrant_point_id: result.qdrant_point_id,
      embed_model: result.embed_model,
      nocodb: result.nocodb,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
