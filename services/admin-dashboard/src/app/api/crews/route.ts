export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const CREW_API = process.env.CREW_API_URL ?? 'http://s0k444ck0w4cgc400skwkos0.46.224.145.109.sslip.io';
const NOCODB_URL = process.env.NOCODB_API_URL ?? 'https://nocodb.automation-plus-ki.de';
const NOCODB_TOKEN = process.env.NOCODB_API_TOKEN ?? 'WeWyMvo8QUyzl9LLIZKawX3VxlO8AVC1sWzEJqsK';
const TABLE_CONTENT_PIECES = 'mm1ssn0luruhzyx';

export async function GET() {
  try {
    const [crewsRes, piecesRes] = await Promise.allSettled([
      fetch(`${CREW_API}/crews/`, { next: { revalidate: 0 } }),
      fetch(
        `${NOCODB_URL}/api/v2/tables/${TABLE_CONTENT_PIECES}/records?limit=20&sort=-created_at`,
        { headers: { 'xc-token': NOCODB_TOKEN }, next: { revalidate: 0 } }
      ),
    ]);

    let rawCrews: unknown = [];
    if (crewsRes.status === 'fulfilled' && crewsRes.value.ok) {
      rawCrews = await crewsRes.value.json();
    }
    const crewsRaw: Array<{ id: string; name: string; agents: number; tasks: number }> = Array.isArray(rawCrews)
      ? rawCrews
      : rawCrews &&
          typeof rawCrews === 'object' &&
          Array.isArray((rawCrews as { crews?: unknown }).crews)
        ? ((rawCrews as { crews: typeof crewsRaw }).crews ?? [])
        : [];

    const pieces: Array<Record<string, unknown>> =
      piecesRes.status === 'fulfilled' && piecesRes.value.ok
        ? ((await piecesRes.value.json()).list ?? [])
        : [];

    const crewLastRun: Record<string, string> = {};
    for (const piece of pieces) {
      if (String(piece.piece_id ?? '').startsWith('crew-')) {
        crewLastRun['content_generation_crew'] = String(piece.created_at ?? piece.CreatedAt ?? '');
        break;
      }
    }

    const enriched = crewsRaw.map((c) => ({
      ...c,
      last_run: crewLastRun[c.id] ?? null,
      recent_pieces: pieces
        .filter((p) => String(p.piece_id ?? '').startsWith('crew-'))
        .slice(0, 3)
        .map((p) => ({
          piece_id: String(p.piece_id ?? ''),
          title: String(p.title ?? ''),
          status: String(p.status ?? ''),
          created_at: String(p.created_at ?? p.CreatedAt ?? ''),
        })),
    }));

    const crewApiReachable = crewsRes.status === 'fulfilled' && crewsRes.value.ok;

    return NextResponse.json({
      crews: enriched,
      total_pieces: pieces.length,
      crew_api_reachable: crewApiReachable,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fehler', crews: [], total_pieces: 0, crew_api_reachable: false },
      { status: 500 }
    );
  }
}
