import { NextResponse } from "next/server";
import { getBezirke } from "@/lib/nocodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const bezirke = await getBezirke();
  return NextResponse.json(bezirke);
}
