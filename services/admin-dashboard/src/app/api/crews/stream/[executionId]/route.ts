export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const CREW_API = process.env.CREW_API_URL ?? 'http://s0k444ck0w4cgc400skwkos0.46.224.145.109.sslip.io';

/** Proxied SSE → Crew-API `GET /crews/executions/:executionId` (kein Browser-CORS). */
export async function GET(
  _request: Request,
  { params }: { params: { executionId: string } }
) {
  const executionId = params.executionId?.trim();
  if (!executionId) {
    return new Response('executionId required', { status: 400 });
  }

  const upstream = await fetch(`${CREW_API}/crews/executions/${encodeURIComponent(executionId)}`, {
    headers: { Accept: 'text/event-stream' },
    cache: 'no-store',
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(
      JSON.stringify({ error: `crew-api upstream ${upstream.status}` }),
      {
        status: upstream.status >= 400 ? upstream.status : 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
