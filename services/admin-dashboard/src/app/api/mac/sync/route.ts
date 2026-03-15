import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, unauthorizedResponse } from "@/lib/auth";
import { syncProjects, type MacSyncPayload } from "@/lib/mac-store";
import { pushEvent } from "@/lib/activity-store";

export const dynamic = "force-dynamic";

/**
 * POST /api/mac/sync
 * Empfängt Scan-Daten vom Mac-Scanner und speichert sie.
 * Header: Authorization: Bearer <DASHBOARD_API_KEY>
 */
export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) return unauthorizedResponse();

  let payload: MacSyncPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(payload.projects)) {
    return NextResponse.json({ error: "projects muss ein Array sein" }, { status: 400 });
  }

  const imported = syncProjects(payload);
  pushEvent("mac-sync", `Mac Scan: ${imported} Projekte`, `Host: ${payload.host ?? "mac"}`);

  return NextResponse.json({
    ok: true,
    imported,
    total: payload.projects.length,
    syncedAt: new Date().toISOString(),
  });
}
