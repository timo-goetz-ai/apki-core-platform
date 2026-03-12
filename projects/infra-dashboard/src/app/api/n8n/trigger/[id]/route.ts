import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.automation-plus-ki.de";
const N8N_API_KEY = process.env.N8N_API_KEY ?? "";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!N8N_API_KEY) {
    return NextResponse.json({ error: "N8N_API_KEY not configured" }, { status: 503 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // no body is fine
  }

  try {
    const res = await fetch(`${N8N_BASE}/api/v1/workflows/${id}/run`, {
      method: "POST",
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
