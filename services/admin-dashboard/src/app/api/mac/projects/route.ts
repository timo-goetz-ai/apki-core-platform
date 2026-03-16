import { NextRequest, NextResponse } from "next/server";
import { macStore } from "@/lib/mac-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/mac/projects
 * Gibt alle gespeicherten Mac-Projekte zurück.
 * Header: Authorization: Bearer <DASHBOARD_API_KEY>
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const activity = searchParams.get("activity"); // filter: active | recent | slow | archived
  const type = searchParams.get("type");         // filter: node | python | go | ...

  let projects = macStore.projects;
  if (activity) projects = projects.filter(p => p.activity === activity);
  if (type) projects = projects.filter(p => p.type === type);

  return NextResponse.json({
    lastSync: macStore.lastSync,
    host: macStore.host,
    count: projects.length,
    projects,
  });
}
