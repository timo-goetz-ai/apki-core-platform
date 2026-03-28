export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { fabrikSearchCollection, searchFabrikSnapshots } from '@/lib/fabrik-search';

/**
 * GET /api/fabrik/search?q=...&limit=8
 * Semantische Ähnlichkeit in der Fabrik-Collection (nur kind=fabrik_snapshot).
 */
export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (!q) {
      return NextResponse.json({ ok: false, error: 'q ist Pflicht' }, { status: 400 });
    }
    const limitRaw = req.nextUrl.searchParams.get('limit');
    const limit = limitRaw ? Number(limitRaw) : 8;
    const hits = await searchFabrikSnapshots(q, limit);
    return NextResponse.json({
      ok: true,
      collection: fabrikSearchCollection(),
      hits,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
