export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Proxied SSE → Crew-API `GET /crews/executions/:executionId`.
 * Kein verifyApiKey: Browser-EventSource kann keinen Authorization-Header setzen.
 * Schutz über Edge-Auth (z. B. Authentik) und/oder nicht-öffentliche Deployment-URL.
 */
export async function GET(
  _request: Request,
  { params }: { params: { executionId: string } }
) {
  const CREW_API = process.env.CREW_API_URL?.trim() ?? '';
  if (!CREW_API) {
    return new Response(JSON.stringify({ error: 'CREW_API_URL ist nicht konfiguriert' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const executionId = params.executionId?.trim();
  if (!executionId) {
    return new Response('executionId required', { status: 400 });
  }

  const base = CREW_API.replace(/\/$/, '');
  const upstream = await fetch(`${base}/crews/executions/${encodeURIComponent(executionId)}`, {
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
