import { NextRequest, NextResponse } from "next/server";
import { getAudit, createAudit } from "@/lib/nocodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const limit = parseInt(new URL(req.url).searchParams.get("limit") ?? "50");
  const eintraege = await getAudit();
  return NextResponse.json(eintraege.slice(0, limit));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await createAudit({
      aktion:    body.aktion ?? "manual",
      akteur:    body.akteur ?? "dashboard",
      ressource: body.ressource ?? "–",
      ergebnis:  body.ergebnis ?? "OK",
      details:   body.details,
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("[audit POST]", e);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
