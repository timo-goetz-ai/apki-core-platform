/**
 * NocoDB REST-Client (v2 API)
 * Doku: https://docs.nocodb.com/developer-resources/rest-apis/overview
 *
 * Benötigte Env-Vars (in Coolify setzen):
 *   NOCODB_URL                      → https://nocodb.automation-plus-ki.de
 *   NOCODB_API_TOKEN                → xc-token aus NocoDB Team → API Tokens
 *   NOCODB_MCP_BEZIRKE_TABLE_ID     → md_xxxxxxxx (Tabellen-ID aus NocoDB)
 *   NOCODB_MCP_MITARBEITER_TABLE_ID → md_xxxxxxxx
 *   NOCODB_MCP_AUDIT_TABLE_ID       → md_xxxxxxxx
 */

import { BEZIRKE_SEED, MITARBEITER_SEED, AUDIT_SEED, type Bezirk, type Mitarbeiter, type AuditEintrag } from "./mcp-stadt-data";

const BASE    = process.env.NOCODB_URL         ?? "https://nocodb.automation-plus-ki.de";
const TOKEN   = process.env.NOCODB_API_TOKEN   ?? "";

const TABLE_BEZIRKE     = process.env.NOCODB_MCP_BEZIRKE_TABLE_ID     ?? "";
const TABLE_MITARBEITER = process.env.NOCODB_MCP_MITARBEITER_TABLE_ID ?? "";
const TABLE_AUDIT       = process.env.NOCODB_MCP_AUDIT_TABLE_ID       ?? "";

export const isConfigured = () => !!TOKEN && !!TABLE_MITARBEITER;

// ── Low-Level Fetch ─────────────────────────────────────────────────────────

async function nocoGet<T>(tableId: string, params?: Record<string, string>): Promise<T[]> {
  const url = new URL(`${BASE}/api/v2/tables/${tableId}/records`);
  url.searchParams.set("limit", "200");
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { "xc-token": TOKEN },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`NocoDB GET ${tableId}: ${res.status}`);
  const json = await res.json();
  // NocoDB v2 returns { list: [...], pageInfo: {...} }
  return (json.list ?? json) as T[];
}

async function nocoPost<T>(tableId: string, data: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}/api/v2/tables/${tableId}/records`, {
    method: "POST",
    headers: { "xc-token": TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`NocoDB POST ${tableId}: ${res.status}`);
  return res.json() as Promise<T>;
}

// ── NocoDB ↔ App-Typen Mapping ──────────────────────────────────────────────
// NocoDB speichert alles als flaches JSON.
// Arrays (tools) werden als kommaseparierter String gespeichert.

type NocoBezirk = {
  Id?: number;
  id?: string;
  name: string;
  emoji: string;
  beschreibung?: string;
  status?: string;
  tools?: string;
  leiterin?: string;
  uptime_pct?: number;
  tasks_heute?: number;
  fehler_heute?: number;
};

type NocoMitarbeiter = {
  Id?: number;
  id?: string;
  name: string;
  rolle: string;
  rolleEmoji?: string;
  bezirk?: string;
  status?: string;
  seit?: string;
  hallucLevel?: number;
  hallucScore?: number;
  hallucExpires?: string;
};

type NocoAudit = {
  Id?: number;
  id?: string;
  ts?: string;
  aktion: string;
  akteur: string;
  ressource: string;
  ergebnis?: string;
  details?: string;
};

function mapBezirk(r: NocoBezirk): Bezirk {
  return {
    id:           String(r.id ?? r.Id ?? r.name),
    name:         r.name,
    emoji:        r.emoji ?? "🏙️",
    beschreibung: r.beschreibung ?? "",
    status:       (r.status as Bezirk["status"]) ?? "online",
    tools:        r.tools ? r.tools.split(",").map((t) => t.trim()) : [],
    leiterin:     r.leiterin,
    uptime_pct:   r.uptime_pct ?? 100,
    tasks_heute:  r.tasks_heute ?? 0,
    fehler_heute: r.fehler_heute ?? 0,
  };
}

function mapMitarbeiter(r: NocoMitarbeiter): Mitarbeiter {
  return {
    id:           String(r.id ?? r.Id ?? r.name),
    name:         r.name,
    rolle:        r.rolle,
    rolleEmoji:   r.rolleEmoji ?? "🔧",
    bezirk:       r.bezirk ?? "Alle",
    status:       (r.status as Mitarbeiter["status"]) ?? "aktiv",
    seit:         r.seit ?? new Date().toISOString().split("T")[0],
    hallucLevel:  r.hallucLevel ?? 0,
    hallucScore:  r.hallucScore ?? 0,
    hallucExpires: r.hallucExpires ?? "",
  };
}

function mapAudit(r: NocoAudit): AuditEintrag {
  return {
    id:       String(r.id ?? r.Id ?? Date.now()),
    ts:       r.ts ?? new Date().toISOString(),
    aktion:   r.aktion,
    akteur:   r.akteur,
    ressource: r.ressource,
    ergebnis: (r.ergebnis as AuditEintrag["ergebnis"]) ?? "OK",
    details:  r.details,
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getBezirke(): Promise<Bezirk[]> {
  if (!TOKEN || !TABLE_BEZIRKE) return BEZIRKE_SEED;
  try {
    const rows = await nocoGet<NocoBezirk>(TABLE_BEZIRKE);
    return rows.map(mapBezirk);
  } catch (e) {
    console.warn("[NocoDB] getBezirke Fehler, Fallback auf Seed:", e);
    return BEZIRKE_SEED;
  }
}

export async function getMitarbeiter(): Promise<Mitarbeiter[]> {
  if (!TOKEN || !TABLE_MITARBEITER) return MITARBEITER_SEED;
  try {
    const rows = await nocoGet<NocoMitarbeiter>(TABLE_MITARBEITER);
    return rows.map(mapMitarbeiter);
  } catch (e) {
    console.warn("[NocoDB] getMitarbeiter Fehler, Fallback auf Seed:", e);
    return MITARBEITER_SEED;
  }
}

export async function createMitarbeiter(data: {
  name: string;
  rolle: string;
  rolleEmoji: string;
  bezirk: string;
}): Promise<Mitarbeiter> {
  if (!TOKEN || !TABLE_MITARBEITER) {
    // In-Memory Fallback (Seed-Patch)
    const m: Mitarbeiter = {
      id: `m${Date.now()}`,
      name: data.name,
      rolle: data.rolle,
      rolleEmoji: data.rolleEmoji,
      bezirk: data.bezirk,
      status: "onboarding",
      seit: new Date().toISOString().split("T")[0],
      hallucLevel: 0,
      hallucScore: 0,
      hallucExpires: "",
    };
    MITARBEITER_SEED.push(m);
    return m;
  }
  const row = await nocoPost<NocoMitarbeiter>(TABLE_MITARBEITER, {
    name:       data.name,
    rolle:      data.rolle,
    rolleEmoji: data.rolleEmoji,
    bezirk:     data.bezirk,
    status:     "onboarding",
    seit:       new Date().toISOString().split("T")[0],
    hallucLevel: 0,
    hallucScore: 0,
  });
  return mapMitarbeiter(row);
}

export async function getAudit(): Promise<AuditEintrag[]> {
  if (!TOKEN || !TABLE_AUDIT) return [...AUDIT_SEED].sort((a, b) => b.ts.localeCompare(a.ts));
  try {
    const rows = await nocoGet<NocoAudit>(TABLE_AUDIT, { sort: "-ts" });
    return rows.map(mapAudit);
  } catch (e) {
    console.warn("[NocoDB] getAudit Fehler, Fallback auf Seed:", e);
    return [...AUDIT_SEED].sort((a, b) => b.ts.localeCompare(a.ts));
  }
}

export async function createAudit(data: Omit<AuditEintrag, "id" | "ts">): Promise<void> {
  if (!TOKEN || !TABLE_AUDIT) {
    AUDIT_SEED.unshift({ id: `a${Date.now()}`, ts: new Date().toISOString(), ...data });
    return;
  }
  try {
    await nocoPost(TABLE_AUDIT, {
      ts:        new Date().toISOString(),
      aktion:    data.aktion,
      akteur:    data.akteur,
      ressource: data.ressource,
      ergebnis:  data.ergebnis,
      details:   data.details ?? "",
    });
  } catch (e) {
    console.warn("[NocoDB] createAudit Fehler:", e);
  }
}
