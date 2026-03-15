import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey, unauthorizedResponse } from "@/lib/auth";
import { macStore } from "@/lib/mac-store";

export const dynamic = "force-dynamic";

/**
 * Raycast Extension API
 *
 * GET  /api/raycast/projects        — Projektliste (für Raycast Suche)
 * POST /api/raycast/projects        — Aktion auf Projekt ausführen
 *
 * Raycast Extension verwendet:
 *   Authorization: Bearer <DASHBOARD_API_KEY>
 *
 * POST Body:
 *   { "projectId": "mac-ai-agent-platform", "action": "open" | "vscode" | "terminal" }
 */

export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) return unauthorizedResponse();

  const q = new URL(request.url).searchParams.get("q")?.toLowerCase() ?? "";
  const projects = macStore.projects
    .filter(p => !q || p.name.toLowerCase().includes(q) || p.path.toLowerCase().includes(q))
    .map(p => ({
      id: p.id,
      name: p.name,
      path: p.path,
      type: p.type,
      activity: p.activity,
      branch: p.git?.branch ?? null,
      remote: p.git?.remote ?? null,
      isDirty: p.git?.isDirty ?? false,
      hasDocker: p.docker.hasDockerfile,
    }));

  return NextResponse.json({
    count: projects.length,
    lastSync: macStore.lastSync,
    projects,
  });
}

export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) return unauthorizedResponse();

  const { projectId, action } = await request.json();
  const project = macStore.projects.find(p => p.id === projectId);
  if (!project) {
    return NextResponse.json({ error: "Projekt nicht gefunden" }, { status: 404 });
  }

  const ALLOWED = new Set(["open", "vscode", "terminal", "cursor"]);
  if (!ALLOWED.has(action)) {
    return NextResponse.json({ error: "Ungültige Aktion" }, { status: 400 });
  }

  // Deeplink zurückgeben — Raycast öffnet diesen auf dem Mac
  const deeplinks: Record<string, string> = {
    open:     `open "${project.path}"`,
    vscode:   `code "${project.path}"`,
    cursor:   `cursor "${project.path}"`,
    terminal: `open -a Terminal "${project.path}"`,
  };

  return NextResponse.json({
    ok: true,
    command: deeplinks[action],
    project: { id: project.id, name: project.name, path: project.path },
  });
}
