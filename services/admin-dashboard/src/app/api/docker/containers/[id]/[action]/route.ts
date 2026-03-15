import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, unauthorizedResponse } from "@/lib/auth";

export const dynamic = "force-dynamic";

const DOCKER_HOST = process.env.DOCKER_HOST ?? "tcp://localhost:2375";

function dockerBaseUrl(): string {
  return DOCKER_HOST.startsWith("tcp://")
    ? DOCKER_HOST.replace("tcp://", "http://")
    : "http://localhost:2375";
}

const ALLOWED_ACTIONS = new Set(["start", "stop", "restart"]);

/**
 * POST /api/docker/containers/:id/:action
 * Startet/stoppt/restartet einen Container via Docker Remote API.
 * Erfordert API-Key.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  if (!verifyApiKey(request)) return unauthorizedResponse();

  const { id, action } = await params;
  if (!ALLOWED_ACTIONS.has(action)) {
    return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
  }

  try {
    const res = await fetch(`${dockerBaseUrl()}/containers/${id}/${action}`, {
      method: "POST",
      signal: AbortSignal.timeout(8000),
    });
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
