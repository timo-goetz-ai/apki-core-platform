import { NextRequest, NextResponse } from "next/server";
import { getMCPDienste, createMCPDienst, createAudit, isConfigured } from "@/lib/nocodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const liste = await getMCPDienste();
  return NextResponse.json(liste);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.funktion) {
      return NextResponse.json({ error: "name und funktion sind Pflicht" }, { status: 400 });
    }

    const d = await createMCPDienst({
      name:        body.name,
      funktion:    body.funktion,
      dienstEmoji: body.dienstEmoji ?? "⚙️",
      projekt:     body.projekt ?? "infrastruktur",
    });

    await createAudit({
      aktion:    "service_onboard",
      akteur:    "dashboard",
      ressource: `mcp-dienst/${d.id}`,
      ergebnis:  "OK",
      details:   `${d.dienstEmoji} ${d.name} — ${d.funktion}`,
    });

    return NextResponse.json(d, { status: 201 });
  } catch (e) {
    console.error("[dienste POST]", e);
    return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
  }
}

export async function HEAD() {
  return NextResponse.json({ nocodb: isConfigured() });
}
