export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { unauthorizedResponse, verifyApiKey } from '@/lib/auth';

const TABLE_CONTENT_PIECES = 'mm1ssn0luruhzyx';

export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) return unauthorizedResponse();

  const CREW_API = process.env.CREW_API_URL?.trim() ?? '';
  const NOCODB_URL = (process.env.NOCODB_API_URL ?? 'https://nocodb.automation-plus-ki.de').replace(/\/$/, '');
  const NOCODB_TOKEN = process.env.NOCODB_API_TOKEN?.trim() ?? '';

  if (!CREW_API) {
    return NextResponse.json(
      {
        error: 'CREW_API_URL ist nicht konfiguriert',
        crews: [],
        total_pieces: 0,
        crew_api_reachable: false,
      },
      { status: 503 }
    );
  }

  const crewBase = CREW_API.replace(/\/$/, '');

  try {
    const crewsRes = await fetch(`${crewBase}/crews/`, { next: { revalidate: 0 } });

    let rawCrews: unknown = [];
    if (crewsRes.ok) {
      rawCrews = await crewsRes.json();
    }

    const crewsRaw: Array<{ id: string; name: string; agents: number; tasks: number }> = Array.isArray(rawCrews)
      ? rawCrews
      : rawCrews &&
          typeof rawCrews === 'object' &&
          Array.isArray((rawCrews as { crews?: unknown }).crews)
        ? ((rawCrews as { crews: typeof crewsRaw }).crews ?? [])
        : [];

    let pieces: Array<Record<string, unknown>> = [];
    if (NOCODB_TOKEN) {
      const piecesRes = await fetch(
        `${NOCODB_URL}/api/v2/tables/${TABLE_CONTENT_PIECES}/records?limit=20&sort=-CreatedAt`,
        { headers: { 'xc-token': NOCODB_TOKEN }, next: { revalidate: 0 } }
      );
      if (piecesRes.ok) {
        const body = (await piecesRes.json()) as { list?: Array<Record<string, unknown>> };
        pieces = body.list ?? [];
      }
    }

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

    const crewApiReachable = crewsRes.ok;

    return NextResponse.json({
      crews: enriched,
      total_pieces: pieces.length,
      crew_api_reachable: crewApiReachable,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : 'Fehler',
        crews: [],
        total_pieces: 0,
        crew_api_reachable: false,
      },
      { status: 500 }
    );
  }
}
