import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DOCKER_HOST = process.env.DOCKER_HOST ?? "tcp://localhost:2375";

function dockerBaseUrl(): string {
  if (DOCKER_HOST.startsWith("tcp://")) {
    return DOCKER_HOST.replace("tcp://", "http://");
  }
  // unix socket not supported in Edge/Node fetch — use tcp
  return "http://localhost:2375";
}

/**
 * GET /api/docker/containers
 * Proxy zur Docker Remote API auf dem Mac.
 * Setzt DOCKER_HOST=tcp://mac-local-ip:2375 in Coolify.
 */
export async function GET() {
  try {
    const res = await fetch(`${dockerBaseUrl()}/containers/json?all=1`, {
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(`Docker API: ${res.status}`);
    const containers = await res.json();
    return NextResponse.json({ containers });
  } catch (e) {
    return NextResponse.json(
      { error: String(e), containers: [] },
      { status: 503 }
    );
  }
}
