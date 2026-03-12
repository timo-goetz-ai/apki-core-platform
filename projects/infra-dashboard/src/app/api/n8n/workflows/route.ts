import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const N8N_BASE = process.env.N8N_BASE_URL ?? "https://n8n.automation-plus-ki.de";
const N8N_API_KEY = process.env.N8N_API_KEY ?? "";

export async function GET() {
  if (!N8N_API_KEY) {
    return NextResponse.json(
      { error: "N8N_API_KEY not configured", workflows: [] },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(`${N8N_BASE}/api/v1/workflows?limit=50`, {
      headers: {
        "X-N8N-API-KEY": N8N_API_KEY,
        "Content-Type": "application/json",
      },
      next: { revalidate: 30 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `n8n returned ${res.status}`, workflows: [] },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ workflows: data.data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: String(err), workflows: [] },
      { status: 500 }
    );
  }
}
