import { NextResponse } from "next/server";
import { store } from "@/lib/mcp-stadt-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(store.getAudit().slice(0, 50));
}
