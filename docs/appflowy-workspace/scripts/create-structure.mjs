#!/usr/bin/env node
/**
 * AppFlowy Workspace-Struktur erstellen
 *
 * Erstellt die Blueprint-Struktur in AppFlowy via Browser-Automatisierung.
 * Voraussetzung: Bereits in AppFlowy eingeloggt (Authentik) oder Login beim Start.
 *
 * Nutzung:
 *   npm run create          # Headless (schnell, für CI)
 *   npm run create:headed   # Mit Browser sichtbar
 *   npm run create:slow     # Langsam, für Debugging
 *
 * URL: https://appflowy.automation-plus-ki.de
 */

import { chromium } from "playwright";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const APPFLOWY_URL = process.env.APPFLOWY_URL || "https://appflowy.automation-plus-ki.de";

const args = process.argv.slice(2);
const headed = args.includes("--headed");
const slow = args.includes("--slow");

// Struktur: { name, type: "page"|"folder", children?: [], content?: "filename" }
// Workspace Audit 08.03.2026 — Phase 9 Zielarchitektur
const STRUCTURE = {
  name: "Workspace",
  children: [
    { name: "Dashboard", type: "page", content: "01_Dashboard.md" },
    { name: "WORKSPACE_AUDIT", type: "page", content: "02_WORKSPACE_AUDIT.md" },
    {
      name: "DOCS",
      type: "folder",
      children: [
        { name: "ARCHITECTURE", type: "page", content: "docs/ARCHITECTURE.md" },
        { name: "SERVICES", type: "page", content: "docs/SERVICES.md" },
        { name: "NEXT_ACTIONS", type: "page", content: "docs/NEXT_ACTIONS.md" },
      ],
    },
    {
      name: "_Vorlagen",
      type: "folder",
      children: [
        {
          name: "Templates",
          type: "folder",
          children: [
            { name: "Task", type: "page", content: "vorlagen/templates/Task.md" },
            { name: "Meeting", type: "page", content: "vorlagen/templates/Meeting.md" },
            { name: "Research", type: "page", content: "vorlagen/templates/Research.md" },
            { name: "Config", type: "page", content: "vorlagen/templates/Config.md" },
          ],
        },
        {
          name: "Skills",
          type: "folder",
          children: [
            { name: "Development", type: "page", content: "vorlagen/skills/Development.md" },
            { name: "Content", type: "page", content: "vorlagen/skills/Content.md" },
            { name: "Recherche", type: "page", content: "vorlagen/skills/Recherche.md" },
            { name: "Planung", type: "page", content: "vorlagen/skills/Planung.md" },
          ],
        },
        {
          name: "Rollen",
          type: "folder",
          children: [
            { name: "Owner", type: "page", content: "vorlagen/rollen/Owner.md" },
            { name: "Reviewer", type: "page", content: "vorlagen/rollen/Reviewer.md" },
            { name: "Executor", type: "page", content: "vorlagen/rollen/Executor.md" },
          ],
        },
        { name: "Plugins", type: "page", content: "vorlagen/Plugins.md" },
        { name: "MCP-Server", type: "page", content: "vorlagen/MCP-Server.md" },
      ],
    },
    {
      name: "Projekte",
      type: "folder",
      children: [
        { id: "01_Infrastructure", content: "projekt/Einstieg_01_Infrastructure.md" },
        { id: "02_Platform", content: "projekt/Einstieg_02_Platform.md" },
        { id: "03_Agents", content: "projekt/Einstieg_03_Agents.md" },
        { id: "04_Voice", content: "projekt/Einstieg_04_Voice.md" },
        { id: "05_Data", content: "projekt/Einstieg_05_Data.md" },
        { id: "06_MCP", content: "projekt/Einstieg_06_MCP.md" },
        { id: "07_Automation", content: "projekt/Einstieg_07_Automation.md" },
        { id: "08_Experiments", content: "projekt/Einstieg_08_Experiments.md" },
      ].map((p) => ({
        name: p.id,
        type: "folder",
        children: [
          { name: "Einstieg", type: "page", content: p.content },
          { name: "Tasks", type: "folder" },
          { name: "Configs", type: "folder" },
          { name: "Rollen", type: "folder" },
          { name: "Plugins", type: "folder" },
          { name: "MCP-Server", type: "folder" },
          { name: "Ergebnis", type: "folder" },
        ],
      })),
    },
  ],
};

function loadContent(relPath, projectName) {
  try {
    let text = readFileSync(join(ROOT, relPath), "utf-8");
    if (projectName) {
      text = text.replace(/\[Projektname\]/g, projectName);
    }
    return text;
  } catch {
    return "";
  }
}

async function trySelector(page, selectors, action = "click") {
  for (const sel of selectors) {
    try {
      const el = typeof sel === "string" ? page.locator(sel) : sel;
      await el.waitFor({ state: "visible", timeout: 2000 });
      if (action === "click") await el.click();
      return true;
    } catch {
      continue;
    }
  }
  return false;
}

async function createPageOrFolder(page, item, depth = 0) {
  const indent = "  ".repeat(depth);
  const isFolder = item.type === "folder" || item.children;
  const label = isFolder ? "Ordner" : "Seite";

  console.log(`${indent}→ ${label}: ${item.name}`);

  // 1. Versuche "Add" / "New" Button zu finden (Seitenleiste)
  const addSelectors = [
    page.getByRole("button", { name: /add|new|hinzufügen|create/i }),
    page.getByRole("button", { name: /\+/ }),
    page.locator('[aria-label*="add" i], [aria-label*="new" i]'),
    page.locator('button:has-text("+")'),
    page.locator('[data-testid*="add"]'),
    page.locator('.sidebar button').first(),
  ];

  const added = await trySelector(page, addSelectors);
  if (!added) {
    console.log(`${indent}  ⚠ Kein Add-Button gefunden. Manuell erstellen oder Selectors anpassen.`);
    return;
  }

  await page.waitForTimeout(slow ? 1500 : 400);

  // 2. Namen eingeben (falls Eingabefeld erscheint)
  const inputSelectors = [
    page.locator('input[type="text"]'),
    page.locator('[contenteditable="true"]').first(),
    page.getByRole("textbox"),
  ];

  for (const inp of inputSelectors) {
    try {
      await inp.waitFor({ state: "visible", timeout: 1000 });
      await inp.fill("");
      await inp.fill(item.name);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(slow ? 800 : 300);
      break;
    } catch {
      continue;
    }
  }

  // 3. Content einfügen (wenn Seite und content vorhanden)
  if (item.content && !isFolder) {
    const content = loadContent(item.content, item.projectName);
    if (content) {
      await page.waitForTimeout(500);
      // Versuche Editor zu finden und Markdown einzufügen
      const editorSelectors = [
        page.locator('[contenteditable="true"]').last(),
        page.locator('.editor, [data-block-type]').first(),
        page.locator('main').first(),
      ];
      for (const ed of editorSelectors) {
        try {
          await ed.waitFor({ state: "visible", timeout: 1000 });
          await ed.click();
          await page.keyboard.press("Control+a");
          await page.keyboard.type(content, { delay: slow ? 20 : 5 });
          break;
        } catch {
          continue;
        }
      }
    }
  }
}

async function walkStructure(page, node, path = [], depth = 0) {
  if (!node.children && node.type !== "folder") {
    await createPageOrFolder(page, node, depth);
    return;
  }

  const items = Array.isArray(node.children) ? node.children : [];
  for (const item of items) {
    const name = typeof item === "string" ? item : item.name;
    const fullItem = typeof item === "string" ? { name, type: "folder" } : item;

    await createPageOrFolder(page, fullItem, depth);

    if (fullItem.children && fullItem.children.length > 0) {
      // In Unterordner navigieren (Sidebar-Klick) und rekursiv
      try {
        const link = page.getByText(name, { exact: true }).first();
        await link.click();
        await page.waitForTimeout(300);
      } catch {}

      await walkStructure(page, { children: fullItem.children }, [...path, name], depth + 1);

      // Zurück (optional)
      try {
        await page.keyboard.press("Escape");
      } catch {}
    }
  }
}

async function main() {
  console.log("AppFlowy Workspace-Setup");
  console.log("URL:", APPFLOWY_URL);
  console.log("Modus:", headed ? "headed" : "headless", slow ? "(slow)" : "");
  console.log("");

  const browser = await chromium.launch({
    headless: !headed,
    slowMo: slow ? 100 : 0,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  });

  const page = await context.newPage();

  try {
    await page.goto(APPFLOWY_URL, { waitUntil: "networkidle", timeout: 30000 });

    // Login-Check: Wenn Authentik-Login-Seite, warten
    const url = page.url();
    if (url.includes("authentik") || url.includes("login") || url.includes("signin")) {
      console.log("→ Login-Seite erkannt. Bitte einloggen (60 Sekunden)...");
      await page.waitForTimeout(60000);
    }

    // Warten bis AppFlowy geladen
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    console.log("→ Struktur wird erstellt...\n");

    await walkStructure(page, STRUCTURE);

    console.log("\n→ Fertig. Browser bleibt 10 Sekunden offen.");
    await page.waitForTimeout(10000);
  } catch (err) {
    console.error("Fehler:", err.message);
    if (headed) {
      console.log("Browser bleibt offen zur Inspektion.");
      await page.waitForTimeout(60000);
    }
  } finally {
    await browser.close();
  }
}

main();
