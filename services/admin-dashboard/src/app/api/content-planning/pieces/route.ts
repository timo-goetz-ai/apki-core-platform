import { NextRequest, NextResponse } from 'next/server';
import { getContentPiecesByDateRange, updateContentPiece, type ContentStatus } from '@/lib/nocodb';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const from = searchParams.get('from') ?? new Date(Date.now() - 7 * 86400_000).toISOString().split('T')[0];
  const to   = searchParams.get('to')   ?? new Date(Date.now() + 30 * 86400_000).toISOString().split('T')[0];

  try {
    const pieces = await getContentPiecesByDateRange(from, to);
    return NextResponse.json({ pieces });
  } catch (e) {
    console.error('[ContentPlanning] GET Fehler:', e);
    return NextResponse.json({ pieces: [], error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const id = Number(searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 });

  try {
    const body = await req.json() as { scheduled_at?: string; status?: ContentStatus };
    await updateContentPiece(id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[ContentPlanning] PATCH Fehler:', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
