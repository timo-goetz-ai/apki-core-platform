import { NextRequest, NextResponse } from "next/server";
import { getMitarbeiter, createMitarbeiter, createAudit, isConfigured } from "@/lib/nocodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const liste = await getMitarbeiter();
  return NextResponse.json(liste);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.rolle) {
      return NextResponse.json({ error: "name und rolle sind Pflicht" }, { status: 400 });
    }

    const m = await createMitarbeiter({
      name:       body.name,
      rolle:      body.rolle,
      rolleEmoji: body.rolleEmoji ?? "🔧",
      bezirk:     body.bezirk ?? "Alle",
    });

    await createAudit({
      aktion:    "mitarbeiter_created",
      akteur:    "dashboard",
      ressource: `mitarbeiter/${m.id}`,
      ergebnis:  "OK",
      details:   `${m.rolleEmoji} ${m.name} — ${m.rolle}`,
    });

    return NextResponse.json(m, { status: 201 });
  } catch (e) {
    console.error("[mitarbeiter POST]", e);
    return NextResponse.json({ error: "Fehler beim Anlegen" }, { status: 500 });
  }
}

export async function HEAD() {
  return NextResponse.json({ nocodb: isConfigured() });
}
