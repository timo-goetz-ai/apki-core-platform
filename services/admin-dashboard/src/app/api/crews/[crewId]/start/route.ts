import { NextRequest, NextResponse } from 'next/server';
import { unauthorizedResponse, verifyApiKey } from '@/lib/auth';

/** Proxied POST → Crew-API `POST /crews/{crew_id}/start` (liefert execution_id). */
export async function POST(
  req: NextRequest,
  { params }: { params: { crewId: string } }
) {
  if (!verifyApiKey(req)) return unauthorizedResponse();

  const CREW_API = process.env.CREW_API_URL?.trim() ?? '';
  if (!CREW_API) {
    return NextResponse.json({ error: 'CREW_API_URL ist nicht konfiguriert' }, { status: 503 });
  }

  const crewId = params.crewId;
  if (!crewId) {
    return NextResponse.json({ error: 'crewId required' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const base = CREW_API.replace(/\/$/, '');

  try {
    const r = await fetch(`${base}/crews/${encodeURIComponent(crewId)}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });
    const text = await r.text();
    let data: unknown = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    return NextResponse.json(data, { status: r.ok ? 200 : r.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}
