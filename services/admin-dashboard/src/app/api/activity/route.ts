import { NextRequest, NextResponse } from "next/server";
import { activityStore } from "@/lib/activity-store";

export const dynamic = "force-dynamic";

/** GET /api/activity?limit=50 */
export async function GET(request: NextRequest) {
  const limit = parseInt(new URL(request.url).searchParams.get("limit") ?? "50");
  return NextResponse.json({
    count: activityStore.events.length,
    events: activityStore.events.slice(0, limit),
  });
}
