/**
 * Liest den Inhalt einer einzelnen Datei aus dem Agentic OS Verzeichnis.
 *
 * GET /api/agentic-os/file?path=07_Prompt_Library/senior-engineer.md
 *
 * Sicherheit: Pfad wird auf AGENTIC_OS_BASE_PATH beschränkt (path traversal schutz).
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ALLOWED_EXTENSIONS = new Set([".md", ".txt", ".json", ".yaml", ".yml", ".py", ".ts"]);

export async function GET(req: NextRequest) {
  const filePath = new URL(req.url).searchParams.get("path");

  if (!filePath) {
    return NextResponse.json({ error: "path Parameter fehlt" }, { status: 400 });
  }

  const basePath = process.env.AGENTIC_OS_BASE_PATH ?? "";
  if (!basePath) {
    return NextResponse.json({ error: "AGENTIC_OS_BASE_PATH nicht konfiguriert" }, { status: 503 });
  }

  // Path traversal prevention
  const resolved = path.resolve(basePath, filePath);
  if (!resolved.startsWith(path.resolve(basePath))) {
    return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
  }

  const ext = path.extname(resolved).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: `Dateityp ${ext} nicht erlaubt` }, { status: 400 });
  }

  if (!fs.existsSync(resolved)) {
    return NextResponse.json({ error: "Datei nicht gefunden" }, { status: 404 });
  }

  try {
    const content = fs.readFileSync(resolved, "utf-8");
    const stat = fs.statSync(resolved);
    return NextResponse.json({
      name: path.basename(resolved),
      path: filePath,
      content,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    });
  } catch (e) {
    console.error("[agentic-os/file]", e);
    return NextResponse.json({ error: "Lesefehler" }, { status: 500 });
  }
}
