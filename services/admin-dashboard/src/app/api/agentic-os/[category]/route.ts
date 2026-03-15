/**
 * Dynamic Filesystem API für das Agentic OS
 *
 * Liest Verzeichnisinhalt aus dem konfigurierten Basis-Pfad.
 * Neue Dateien erscheinen automatisch ohne Code-Änderungen.
 *
 * Env-Var (in Coolify setzen):
 *   AGENTIC_OS_BASE_PATH → z.B. /workspace/03_ai-agent-platform
 *   (lokal Mac: ~/Geschäft/STUDIO/03_AI_Engineering/07_Projects/03_ai-agent-platform)
 *
 * Unterstützte Kategorien:
 *   active-projects  → 02_Active_Projects/
 *   agents           → 03_Agents/
 *   automations      → 04_Automations/
 *   dashboards       → 05_Dashboards/
 *   ai-ops           → 01_AI_Ops/
 *   prompts          → 07_Prompt_Library/
 *   templates        → 08_Templates/
 *   workflows        → 10_Workflows/
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const CATEGORY_MAP: Record<string, string> = {
  "active-projects": "02_Active_Projects",
  "agents":          "03_Agents",
  "automations":     "04_Automations",
  "dashboards":      "05_Dashboards",
  "ai-ops":          "01_AI_Ops",
  "prompts":         "07_Prompt_Library",
  "templates":       "08_Templates",
  "workflows":       "10_Workflows",
};

export type FsEntry = {
  name: string;
  displayName: string;
  type: "file" | "directory";
  ext: string;
  size: number;
  modified: string;
  path: string;          // relativer Pfad ab AGENTIC_OS_BASE_PATH
};

function getBasePath(): string {
  return process.env.AGENTIC_OS_BASE_PATH ?? "";
}

function toDisplayName(name: string): string {
  return name
    .replace(/\.(md|txt|json|yaml|yml)$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { category: string } }
) {
  const { category } = params;
  const folderName = CATEGORY_MAP[category];

  if (!folderName) {
    return NextResponse.json(
      { error: `Unbekannte Kategorie: ${category}`, available: Object.keys(CATEGORY_MAP) },
      { status: 400 }
    );
  }

  const basePath = getBasePath();

  if (!basePath) {
    return NextResponse.json({
      entries: [],
      category,
      folder: folderName,
      configured: false,
      message: "AGENTIC_OS_BASE_PATH nicht gesetzt — Fallback auf leere Liste",
    });
  }

  const dirPath = path.join(basePath, folderName);

  if (!fs.existsSync(dirPath)) {
    return NextResponse.json({
      entries: [],
      category,
      folder: folderName,
      configured: true,
      message: `Verzeichnis nicht gefunden: ${dirPath}`,
    });
  }

  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    const entries: FsEntry[] = items
      .filter((item) => !item.name.startsWith("."))
      .map((item) => {
        const fullPath = path.join(dirPath, item.name);
        const stat = fs.statSync(fullPath);
        const ext = path.extname(item.name).toLowerCase();
        return {
          name: item.name,
          displayName: toDisplayName(item.name),
          type: (item.isDirectory() ? "directory" : "file") as "file" | "directory",
          ext,
          size: stat.size,
          modified: stat.mtime.toISOString(),
          path: path.join(folderName, item.name),
        };
      })
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({
      entries,
      category,
      folder: folderName,
      configured: true,
      total: entries.length,
    });
  } catch (e) {
    console.error(`[agentic-os/${category}]`, e);
    return NextResponse.json({ error: "Lesefehler", entries: [] }, { status: 500 });
  }
}
