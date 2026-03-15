import { NextRequest, NextResponse } from "next/server";
import { store, Mitarbeiter } from "@/lib/mcp-stadt-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(store.getMitarbeiter());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const m: Mitarbeiter = {
      id: `m${Date.now()}`,
      name: body.name,
      rolle: body.rolle,
      rolleEmoji: body.rolleEmoji ?? "🔧",
      bezirk: body.bezirk ?? "Alle",
      status: "onboarding",
      seit: new Date().toISOString().split("T")[0],
      hallucLevel: 0,
      hallucScore: 0,
      hallucExpires: "",
    };
    store.addMitarbeiter(m);
    return NextResponse.json(m, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ungültige Daten" }, { status: 400 });
  }
}
