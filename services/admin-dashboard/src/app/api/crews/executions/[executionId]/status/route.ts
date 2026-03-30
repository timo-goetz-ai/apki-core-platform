import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyApiKey } from "@/lib/auth";

/** Proxied GET → Crew-API `GET /crews/executions/:id/status` (Polling-Fallback zum SSE). */
export async function GET(
  req: NextRequest,
  { params }: { params: { executionId: string } }
) {
  if (!verifyApiKey(req)) return unauthorizedResponse();

  const CREW_API = process.env.CREW_API_URL?.trim() ?? "";
  if (!CREW_API) {
    return NextResponse.json(
      { error: "CREW_API_URL ist nicht konfiguriert" },
      { status: 503 }
    );
  }

  const executionId = params.executionId?.trim();
  if (!executionId) {
    return NextResponse.json({ error: "executionId required" }, { status: 400 });
  }

  const base = CREW_API.replace(/\/$/, "");

  try {
    const r = await fetch(
      `${base}/crews/executions/${encodeURIComponent(executionId)}/status`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      }
    );
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
