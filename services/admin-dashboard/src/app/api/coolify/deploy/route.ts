import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, unauthorizedResponse } from "@/lib/auth";
import { pushEvent } from "@/lib/activity-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) return unauthorizedResponse();

  const baseUrl = process.env.COOLIFY_URL;
  const apiKey  = process.env.COOLIFY_API_KEY;
  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "Coolify nicht konfiguriert" }, { status: 503 });
  }

  const { serviceId, force } = await request.json();
  if (!serviceId) {
    return NextResponse.json({ error: "serviceId fehlt" }, { status: 400 });
  }

  try {
    const res = await fetch(`${baseUrl}/api/v1/deploy`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uuid: serviceId, force: force ?? false }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json();
    pushEvent("deploy", `Deploy: ${serviceId}`, res.ok ? "gestartet" : "fehlgeschlagen", res.ok);
    return NextResponse.json({ ok: res.ok, deploymentId: data.deploymentId ?? null, raw: data });
  } catch (e) {
    pushEvent("deploy", `Deploy: ${serviceId}`, String(e), false);
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
