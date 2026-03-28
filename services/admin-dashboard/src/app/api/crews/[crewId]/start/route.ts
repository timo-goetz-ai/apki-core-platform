import { NextRequest, NextResponse } from 'next/server';

const CREW_API = process.env.CREW_API_URL ?? 'http://s0k444ck0w4cgc400skwkos0.46.224.145.109.sslip.io';

/** Proxied POST → Crew-API `POST /crews/{crew_id}/start` (liefert execution_id). */
export async function POST(
  req: NextRequest,
  { params }: { params: { crewId: string } }
) {
  const crewId = params.crewId;
  if (!crewId) {
    return NextResponse.json({ error: 'crewId required' }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));

  try {
    const r = await fetch(`${CREW_API}/crews/${encodeURIComponent(crewId)}/start`, {
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
