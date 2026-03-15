#!/usr/bin/env node
/**
 * Mac Project Scanner
 * Scannt ~/Desktop und ~/projects nach lokalen Projekten.
 * Gibt eine JSON-Payload aus, die direkt an das Dashboard-API gesendet werden kann.
 *
 * Verwendung:
 *   node scan.js                          # JSON auf stdout
 *   node scan.js --push                   # direkt an Dashboard senden
 *
 * Env-Variablen (für --push):
 *   DASHBOARD_URL    z.B. https://agents.automation-plus-ki.de
 *   DASHBOARD_API_KEY  dein Secret aus Coolify
 */

import { readdir, stat, readFile } from "fs/promises";
import { existsSync } from "fs";
import { join, basename } from "path";
import { homedir } from "os";
import { execSync } from "child_process";

// ── Konfiguration ──────────────────────────────────────────────────────────
const SCAN_ROOTS = [
  join(homedir(), "Desktop"),
  join(homedir(), "projects"),
  join(homedir(), "Projekte"),
  join(homedir(), "Documents", "projects"),
].filter(existsSync);

const DASHBOARD_URL = process.env.DASHBOARD_URL ?? "https://agents.automation-plus-ki.de";
const DASHBOARD_API_KEY = process.env.DASHBOARD_API_KEY ?? "";
const PUSH = process.argv.includes("--push");

// Ordner die niemals als Projekt gelten
const IGNORE_DIRS = new Set([
  "node_modules", ".git", ".next", "dist", "build", "out",
  "__pycache__", ".venv", "venv", ".cache", "vendor",
]);

// ── Hilfsfunktionen ────────────────────────────────────────────────────────
function safeExec(cmd, cwd) {
  try {
    return execSync(cmd, { cwd, encoding: "utf8", stdio: ["pipe", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
}

async function detectProjectType(dir) {
  const checks = [
    ["node",       "package.json"],
    ["python",     "requirements.txt"],
    ["python",     "pyproject.toml"],
    ["go",         "go.mod"],
    ["rust",       "Cargo.toml"],
    ["ruby",       "Gemfile"],
    ["java",       "pom.xml"],
    ["dotnet",     "*.csproj"],
    ["php",        "composer.json"],
  ];
  for (const [type, file] of checks) {
    if (file.includes("*")) {
      const entries = await readdir(dir).catch(() => []);
      if (entries.some(e => e.endsWith(file.replace("*", "")))) return type;
    } else if (existsSync(join(dir, file))) {
      return type;
    }
  }
  return "other";
}

async function getGitInfo(dir) {
  if (!existsSync(join(dir, ".git"))) return null;

  const branch = safeExec("git rev-parse --abbrev-ref HEAD", dir);
  const remote = safeExec("git remote get-url origin", dir);
  const lastCommitDate = safeExec("git log -1 --format=%ci", dir);
  const lastCommitMsg = safeExec("git log -1 --format=%s", dir);
  const isDirty = safeExec("git status --short", dir) !== "";
  const aheadBehind = safeExec("git rev-list --left-right --count HEAD...@{u}", dir);

  let ahead = 0, behind = 0;
  if (aheadBehind) {
    const parts = aheadBehind.split("\t");
    ahead = parseInt(parts[0]) || 0;
    behind = parseInt(parts[1]) || 0;
  }

  return {
    branch,
    remote: remote?.replace(/^git@github\.com:/, "https://github.com/").replace(/\.git$/, "") ?? null,
    lastCommitDate: lastCommitDate ? new Date(lastCommitDate).toISOString() : null,
    lastCommitMsg,
    isDirty,
    ahead,
    behind,
  };
}

async function getDockerInfo(dir) {
  const hasDockerfile = existsSync(join(dir, "Dockerfile"));
  const hasCompose = existsSync(join(dir, "docker-compose.yml")) ||
                     existsSync(join(dir, "docker-compose.yaml")) ||
                     existsSync(join(dir, "compose.yml"));
  return { hasDockerfile, hasCompose };
}

function calcActivityStatus(git, lastModified) {
  if (!git?.lastCommitDate && !lastModified) return "unknown";

  const ref = git?.lastCommitDate ? new Date(git.lastCommitDate) : new Date(lastModified);
  const daysSince = (Date.now() - ref.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSince < 7)  return "active";
  if (daysSince < 30) return "recent";
  if (daysSince < 90) return "slow";
  return "archived";
}

async function getLastModified(dir) {
  try {
    const s = await stat(dir);
    return s.mtime.toISOString();
  } catch {
    return null;
  }
}

async function readPackageName(dir) {
  try {
    const raw = await readFile(join(dir, "package.json"), "utf8");
    const pkg = JSON.parse(raw);
    return pkg.name ?? null;
  } catch {
    return null;
  }
}

async function scanDirectory(root) {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const projects = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (IGNORE_DIRS.has(entry.name)) continue;
    if (entry.name.startsWith(".")) continue;

    const dir = join(root, entry.name);
    const isGitRepo = existsSync(join(dir, ".git"));
    const docker = await getDockerInfo(dir);

    // Nur als Projekt werten wenn git oder Dockerfile vorhanden
    if (!isGitRepo && !docker.hasDockerfile && !docker.hasCompose) continue;

    const git = await getGitInfo(dir);
    const lastModified = await getLastModified(dir);
    const projectType = await detectProjectType(dir);
    const packageName = projectType === "node" ? await readPackageName(dir) : null;
    const activity = calcActivityStatus(git, lastModified);

    projects.push({
      id: `mac-${entry.name}`,
      name: packageName ?? entry.name,
      path: dir,
      root,
      type: projectType,
      activity,
      lastModified,
      git: isGitRepo ? git : null,
      docker,
      scannedAt: new Date().toISOString(),
      source: "mac-scanner",
    });
  }

  return projects;
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  if (SCAN_ROOTS.length === 0) {
    console.error("Keine Scan-Verzeichnisse gefunden (~/Desktop, ~/projects)");
    process.exit(1);
  }

  const allProjects = [];
  for (const root of SCAN_ROOTS) {
    const found = await scanDirectory(root);
    allProjects.push(...found);
  }

  const payload = {
    scannedAt: new Date().toISOString(),
    host: process.env.HOSTNAME ?? "mac",
    scanRoots: SCAN_ROOTS,
    projectCount: allProjects.length,
    projects: allProjects,
  };

  if (PUSH) {
    if (!DASHBOARD_API_KEY) {
      console.error("DASHBOARD_API_KEY fehlt. Setze die Env-Variable.");
      process.exit(1);
    }
    const res = await fetch(`${DASHBOARD_URL}/api/mac/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DASHBOARD_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`Push fehlgeschlagen: ${res.status} ${await res.text()}`);
      process.exit(1);
    }
    const result = await res.json();
    console.log(`✓ ${result.imported} Projekte importiert`);
  } else {
    console.log(JSON.stringify(payload, null, 2));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
