/**
 * In-Memory Store für Mac-Projekte.
 * In Production: durch eine echte DB (NocoDB, SQLite, etc.) ersetzen.
 * Der Store überlebt Hot-Reloads dank globalThis.
 */

export interface GitInfo {
  branch: string | null;
  remote: string | null;
  lastCommitDate: string | null;
  lastCommitMsg: string | null;
  isDirty: boolean;
  ahead: number;
  behind: number;
}

export interface DockerInfo {
  hasDockerfile: boolean;
  hasCompose: boolean;
}

export interface MacProject {
  id: string;
  name: string;
  path: string;
  root: string;
  type: "node" | "python" | "go" | "rust" | "ruby" | "java" | "dotnet" | "php" | "other";
  activity: "active" | "recent" | "slow" | "archived" | "unknown";
  lastModified: string | null;
  git: GitInfo | null;
  docker: DockerInfo;
  scannedAt: string;
  source: string;
}

export interface MacSyncPayload {
  scannedAt: string;
  host: string;
  scanRoots: string[];
  projectCount: number;
  projects: MacProject[];
}

export interface MacStoreData {
  lastSync: string | null;
  host: string | null;
  projects: MacProject[];
}

// Persist across Next.js hot reloads in dev
const g = globalThis as typeof globalThis & { __macStore?: MacStoreData };
if (!g.__macStore) {
  g.__macStore = { lastSync: null, host: null, projects: [] };
}

export const macStore = g.__macStore;

export function syncProjects(payload: MacSyncPayload): number {
  const incoming = new Map(payload.projects.map(p => [p.id, p]));

  // Merge: update existing, add new, keep projects not in this scan
  const updated: MacProject[] = [];
  for (const existing of macStore.projects) {
    if (incoming.has(existing.id)) {
      updated.push(incoming.get(existing.id)!);
      incoming.delete(existing.id);
    } else {
      updated.push(existing);
    }
  }
  // Add truly new projects
  incoming.forEach(newProject => updated.push(newProject));

  macStore.projects = updated;
  macStore.lastSync = payload.scannedAt;
  macStore.host = payload.host;

  return payload.projects.length;
}
