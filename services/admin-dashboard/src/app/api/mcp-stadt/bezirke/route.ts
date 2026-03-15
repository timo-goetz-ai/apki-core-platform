// Legacy-Route — leitet auf /api/mcp-plattform/projekte weiter
import { NextResponse } from "next/server";
import { getProjekte } from "@/lib/nocodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const projekte = await getProjekte();
  return NextResponse.json(projekte);
}
