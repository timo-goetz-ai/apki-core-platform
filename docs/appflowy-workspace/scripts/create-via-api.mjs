#!/usr/bin/env node
/**
 * AppFlowy Workspace-Struktur via API (Teilweise)
 *
 * Die AppFlowy Cloud API unterstützt nur:
 * - GET workspaces, folders, databases
 * - POST/PUT database rows (mit document in Markdown)
 *
 * Ordner/Seiten können NICHT per API erstellt werden.
 * Dieses Skript erstellt Database-Rows mit Inhalt, falls eine passende DB existiert.
 *
 * Für vollständige Struktur: create-structure.mjs (Playwright) nutzen.
 *
 * Voraussetzung:
 *   APPFLOWY_URL=https://appflowy.automation-plus-ki.de
 *   APPFLOWY_TOKEN=JWT (von GoTrue /gotrue/token)
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const BASE = process.env.APPFLOWY_URL || "https://appflowy.automation-plus-ki.de";
const TOKEN = process.env.APPFLOWY_TOKEN;

if (!TOKEN) {
  console.log("APPFLOWY_TOKEN nicht gesetzt.");
  console.log("Token holen: POST", BASE + "/gotrue/token");
  console.log('Body: { "grant_type": "password", "email": "...", "password": "..." }');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
};

async function api(path) {
  const res = await fetch(`${BASE}${path}`, { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

function load(path) {
  try {
    return readFileSync(join(ROOT, path), "utf-8");
  } catch {
    return "";
  }
}

async function main() {
  console.log("AppFlowy API – Workspace-Struktur prüfen\n");

  const workspaces = await api("/api/workspace");
  console.log("Workspaces:", JSON.stringify(workspaces, null, 2));

  if (!workspaces?.length) {
    console.log("Kein Workspace gefunden. Bitte zuerst in AppFlowy anlegen.");
    return;
  }

  const wsId = workspaces[0].id;
  const dbs = await api(`/api/workspace/${wsId}/database`);
  console.log("\nDatabases:", JSON.stringify(dbs, null, 2));

  if (!dbs?.length) {
    console.log("Keine Database gefunden. Rows können nicht erstellt werden.");
    console.log("Nutze create-structure.mjs (Playwright) für vollständige Struktur.");
    return;
  }

  const dbId = dbs[0].id;
  const fields = await api(`/api/workspace/${wsId}/database/${dbId}/fields`);
  console.log("\nDatabase Fields:", JSON.stringify(fields, null, 2));

  // Erstelle Rows mit Vorlagen-Inhalt (Workspace Audit 08.03.2026)
  const docs = [
    { name: "Dashboard", path: "01_Dashboard.md" },
    { name: "WORKSPACE_AUDIT", path: "02_WORKSPACE_AUDIT.md" },
    { name: "ARCHITECTURE", path: "docs/ARCHITECTURE.md" },
    { name: "SERVICES", path: "docs/SERVICES.md" },
    { name: "NEXT_ACTIONS", path: "docs/NEXT_ACTIONS.md" },
    { name: "Task", path: "vorlagen/templates/Task.md" },
    { name: "Meeting", path: "vorlagen/templates/Meeting.md" },
    { name: "Research", path: "vorlagen/templates/Research.md" },
    { name: "Config", path: "vorlagen/templates/Config.md" },
    { name: "Plugins", path: "vorlagen/Plugins.md" },
    { name: "MCP-Server", path: "vorlagen/MCP-Server.md" },
    { name: "Owner", path: "vorlagen/rollen/Owner.md" },
    { name: "Reviewer", path: "vorlagen/rollen/Reviewer.md" },
    { name: "Executor", path: "vorlagen/rollen/Executor.md" },
  ];

  for (const d of docs) {
    const content = load(d.path);
    if (!content) continue;
    try {
      const row = await post(`/api/workspace/${wsId}/database/${dbId}/row`, {
        document: content,
      });
      console.log("✓ Row erstellt:", d.name);
    } catch (e) {
      console.log("✗", d.name, e.message);
    }
  }

  console.log("\nFertig. Hinweis: API erstellt nur Rows in DB, keine Ordner/Seiten.");
}

main().catch(console.error);
