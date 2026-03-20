/**
 * NocoDB REST-Client (v2 API)
 * Doku: https://docs.nocodb.com/developer-resources/rest-apis/overview
 *
 * Benötigte Env-Vars (in Coolify setzen):
 *   NOCODB_URL                       → https://nocodb.automation-plus-ki.de
 *   NOCODB_API_TOKEN                 → xc-token aus NocoDB Team → API Tokens
 *   NOCODB_MCP_PROJEKTE_TABLE_ID     → md_xxxxxxxx (Tabellen-ID aus NocoDB)
 *   NOCODB_MCP_DIENSTE_TABLE_ID      → md_xxxxxxxx
 *   NOCODB_MCP_AUDIT_TABLE_ID        → md_xxxxxxxx
 */

import {
  PROJEKTE_SEED,
  MCP_DIENSTE_SEED,
  AUDIT_SEED,
  type Projekt,
  type MCPDienst,
  type AuditEintrag,
} from "./mcp-plattform-data";

const BASE  = process.env.NOCODB_URL       ?? "";
const TOKEN = process.env.NOCODB_API_TOKEN ?? "";

const TABLE_PROJEKTE = process.env.NOCODB_MCP_PROJEKTE_TABLE_ID ?? "";
const TABLE_DIENSTE  = process.env.NOCODB_MCP_DIENSTE_TABLE_ID  ?? "";
const TABLE_AUDIT    = process.env.NOCODB_MCP_AUDIT_TABLE_ID    ?? "";

// ── Base & Table IDs (AI_SYSTEM + Dashboard bases) ──────────────────────────
const AI_SYSTEM_BASE_ID  = process.env.NOCODB_AI_SYSTEM_BASE_ID  ?? 'pfx0ca6docorj8n';
const DASHBOARD_BASE_ID  = process.env.NOCODB_DASHBOARD_BASE_ID  ?? 'pwxfagcnm6bru9w';

const TABLE_AGENTS         = process.env.NOCODB_AGENTS_TABLE_ID         ?? 'mjdp54ldeoxlb8s';
const TABLE_TASKS          = process.env.NOCODB_TASKS_TABLE_ID          ?? 'mrt4iah96z7za7t';
const TABLE_AGENT_RUNS     = process.env.NOCODB_AGENT_RUNS_TABLE_ID     ?? 'm0245soubmzha5r';
const TABLE_PROMPTS        = process.env.NOCODB_PROMPTS_TABLE_ID        ?? 'mijlvsujsgqa92m';
const TABLE_MCP_CONFIGS    = process.env.NOCODB_MCP_CONFIGS_TABLE_ID    ?? 'm128afvs767oxqa';
const TABLE_KNOWLEDGE      = process.env.NOCODB_KNOWLEDGE_TABLE_ID      ?? 'm9hgs3y3iz9xtgl';
const TABLE_PROJEKTE_NEW   = process.env.NOCODB_PROJEKTE_TABLE_ID       ?? 'mn4fqldtnb4f1qn';
const TABLE_WORKFLOW_INDEX = process.env.NOCODB_WORKFLOW_INDEX_TABLE_ID ?? 'mlfy9vbmvhjt7si';
const TABLE_LEADS          = process.env.NOCODB_LEADS_TABLE_ID          ?? 'm3y2aylkfn3ha0n';

// suppress unused-variable warnings for IDs not yet used in queries
void AI_SYSTEM_BASE_ID;
void DASHBOARD_BASE_ID;
void TABLE_AGENT_RUNS;
void TABLE_MCP_CONFIGS;
void TABLE_LEADS;

export const isConfigured = () => !!TOKEN && !!TABLE_DIENSTE;

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

type NocoProjekt = {
  Id?: number;
  id?: string;
  name: string;
  emoji: string;
  beschreibung?: string;
  url?: string;
  status?: string;
  mcpServer?: string;
  owner?: string;
  uptime_pct?: number;
  requests_heute?: number;
  fehler_heute?: number;
};

type NocoMCPDienst = {
  Id?: number;
  id?: string;
  name: string;
  funktion: string;
  dienstEmoji?: string;
  projekt?: string;
  status?: string;
  seit?: string;
  zuverlaessigkeit?: number;
  healthScore?: number;
  lastCheck?: string;
  url?: string;
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

function mapProjekt(r: NocoProjekt): Projekt {
  return {
    id:              String(r.id ?? r.Id ?? r.name),
    name:            r.name,
    emoji:           r.emoji ?? "⚙️",
    beschreibung:    r.beschreibung ?? "",
    url:             r.url ?? "",
    status:          (r.status as Projekt["status"]) ?? "online",
    mcpServer:       r.mcpServer ? r.mcpServer.split(",").map((s) => s.trim()) : [],
    owner:           r.owner,
    uptime_pct:      r.uptime_pct ?? 100,
    requests_heute:  r.requests_heute ?? 0,
    fehler_heute:    r.fehler_heute ?? 0,
  };
}

function mapMCPDienst(r: NocoMCPDienst): MCPDienst {
  return {
    id:               String(r.id ?? r.Id ?? r.name),
    name:             r.name,
    funktion:         r.funktion,
    dienstEmoji:      r.dienstEmoji ?? "⚙️",
    projekt:          r.projekt ?? "infrastruktur",
    status:           (r.status as MCPDienst["status"]) ?? "aktiv",
    seit:             r.seit ?? new Date().toISOString().split("T")[0],
    zuverlaessigkeit: r.zuverlaessigkeit ?? 0,
    healthScore:      r.healthScore ?? 0,
    lastCheck:        r.lastCheck ?? "",
    url:              r.url,
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

export async function getProjekte(): Promise<Projekt[]> {
  if (!TOKEN || !TABLE_PROJEKTE) return PROJEKTE_SEED;
  try {
    const rows = await nocoGet<NocoProjekt>(TABLE_PROJEKTE);
    return rows.map(mapProjekt);
  } catch (e) {
    console.warn("[NocoDB] getProjekte Fehler, Fallback auf Seed:", e);
    return PROJEKTE_SEED;
  }
}

export async function getMCPDienste(): Promise<MCPDienst[]> {
  if (!TOKEN || !TABLE_DIENSTE) return MCP_DIENSTE_SEED;
  try {
    const rows = await nocoGet<NocoMCPDienst>(TABLE_DIENSTE);
    return rows.map(mapMCPDienst);
  } catch (e) {
    console.warn("[NocoDB] getMCPDienste Fehler, Fallback auf Seed:", e);
    return MCP_DIENSTE_SEED;
  }
}

export async function createMCPDienst(data: {
  name: string;
  funktion: string;
  dienstEmoji: string;
  projekt: string;
}): Promise<MCPDienst> {
  if (!TOKEN || !TABLE_DIENSTE) {
    const d: MCPDienst = {
      id: `d${Date.now()}`,
      name: data.name,
      funktion: data.funktion,
      dienstEmoji: data.dienstEmoji,
      projekt: data.projekt,
      status: "onboarding",
      seit: new Date().toISOString().split("T")[0],
      zuverlaessigkeit: 0,
      healthScore: 0,
      lastCheck: "",
    };
    MCP_DIENSTE_SEED.push(d);
    return d;
  }
  const row = await nocoPost<NocoMCPDienst>(TABLE_DIENSTE, {
    name:             data.name,
    funktion:         data.funktion,
    dienstEmoji:      data.dienstEmoji,
    projekt:          data.projekt,
    status:           "onboarding",
    seit:             new Date().toISOString().split("T")[0],
    zuverlaessigkeit: 0,
    healthScore:      0,
  });
  return mapMCPDienst(row);
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

// ── NocoDB client helper ─────────────────────────────────────────────────────

export function getNocoDBClient() {
  return {
    baseUrl: BASE,
    token: TOKEN,
  };
}

// ── AI System & Dashboard table queries ──────────────────────────────────────

export async function getAgents(): Promise<Record<string, unknown>[]> {
  try {
    return await nocoGet<Record<string, unknown>>(TABLE_AGENTS);
  } catch (e) {
    console.warn("[NocoDB] getAgents Fehler:", e);
    return [];
  }
}

export async function getTasks(): Promise<Record<string, unknown>[]> {
  try {
    return await nocoGet<Record<string, unknown>>(TABLE_TASKS);
  } catch (e) {
    console.warn("[NocoDB] getTasks Fehler:", e);
    return [];
  }
}

export async function getPrompts(): Promise<Record<string, unknown>[]> {
  try {
    return await nocoGet<Record<string, unknown>>(TABLE_PROMPTS);
  } catch (e) {
    console.warn("[NocoDB] getPrompts Fehler:", e);
    return [];
  }
}

export async function getKnowledgeItems(): Promise<Record<string, unknown>[]> {
  try {
    return await nocoGet<Record<string, unknown>>(TABLE_KNOWLEDGE);
  } catch (e) {
    console.warn("[NocoDB] getKnowledgeItems Fehler:", e);
    return [];
  }
}

export async function getWorkflowIndex(): Promise<Record<string, unknown>[]> {
  try {
    return await nocoGet<Record<string, unknown>>(TABLE_WORKFLOW_INDEX);
  } catch (e) {
    console.warn("[NocoDB] getWorkflowIndex Fehler:", e);
    return [];
  }
}

export async function createProject(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  try {
    return await nocoPost<Record<string, unknown>>(TABLE_PROJEKTE_NEW, data);
  } catch (e) {
    console.warn("[NocoDB] createProject Fehler:", e);
    throw e;
  }
}

// ── Content Pipeline ─────────────────────────────────────────────────────────

const TABLE_CONTENT_PIPELINE = process.env.NOCODB_CONTENT_PIPELINE_TABLE_ID ?? '';

export interface PipelineJob {
  Id?: number;
  topic: string;
  category: string;
  stage: 'text' | 'image' | 'voice' | 'publish' | 'done';
  status: 'idle' | 'running' | 'done' | 'error';
  text_content?: string;
  image_url?: string;
  audio_url?: string;
  blog_url?: string;
  picsart_inference_id?: string;
  error_message?: string;
  retry_count: number;
  steps_requested?: string;
  created_at?: string;
  updated_at?: string;
}

export async function createPipelineJob(
  data: Pick<PipelineJob, 'topic' | 'category' | 'steps_requested'>
): Promise<PipelineJob> {
  if (!TOKEN || !TABLE_CONTENT_PIPELINE) {
    throw new Error('NOCODB_CONTENT_PIPELINE_TABLE_ID nicht konfiguriert');
  }
  return nocoPost<PipelineJob>(TABLE_CONTENT_PIPELINE, {
    topic:           data.topic,
    category:        data.category,
    stage:           'text',
    status:          'idle',
    retry_count:     0,
    steps_requested: data.steps_requested ?? '["blog","image","voice"]',
    created_at:      new Date().toISOString(),
    updated_at:      new Date().toISOString(),
  });
}

export async function getPipelineJobs(): Promise<PipelineJob[]> {
  if (!TOKEN || !TABLE_CONTENT_PIPELINE) return [];
  try {
    return await nocoGet<PipelineJob>(TABLE_CONTENT_PIPELINE, { sort: '-created_at' });
  } catch (e) {
    console.warn('[NocoDB] getPipelineJobs Fehler:', e);
    return [];
  }
}

export async function getPipelineJob(id: number): Promise<PipelineJob | null> {
  if (!TOKEN || !TABLE_CONTENT_PIPELINE) return null;
  try {
    const url = new URL(`${BASE}/api/v2/tables/${TABLE_CONTENT_PIPELINE}/records`);
    url.searchParams.set('where', `(Id,eq,${id})`);
    url.searchParams.set('limit', '1');
    const res = await fetch(url.toString(), {
      headers: { 'xc-token': TOKEN },
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`NocoDB GET pipeline job: ${res.status}`);
    const json = await res.json() as { list?: PipelineJob[] };
    return json.list?.[0] ?? null;
  } catch (e) {
    console.warn('[NocoDB] getPipelineJob Fehler:', e);
    return null;
  }
}

export async function updatePipelineJob(
  id: number,
  data: Partial<Omit<PipelineJob, 'Id'>>
): Promise<void> {
  if (!TOKEN || !TABLE_CONTENT_PIPELINE) return;
  await fetch(`${BASE}/api/v2/tables/${TABLE_CONTENT_PIPELINE}/records`, {
    method: 'PATCH',
    headers: { 'xc-token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Id: id, ...data, updated_at: new Date().toISOString() }),
  });
}

// ── Resource Registry ────────────────────────────────────────────────────────

const TABLE_RESOURCES   = process.env.NOCODB_RESOURCES_TABLE_ID   ?? 'me17pwfzfyy3u8g';
const TABLE_ERROR_LOGS  = process.env.NOCODB_ERROR_LOGS_TABLE_ID  ?? 'm61q6c12uz6r2j9';

export type ResourceType   = 'docker' | 'model' | 'coolify' | 'github' | 'mcp';
export type ResourceStatus = 'discovered' | 'approved' | 'blocked';

export interface Resource {
  Id?: number | string;
  name: string;
  type: ResourceType;
  source: string;
  status: ResourceStatus;
  metadata?: string;
  discovered_at: string;
  approved_by?: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

export interface ErrorLog {
  Id?: number | string;
  ts: string;
  service: string;
  level: LogLevel;
  message: string;
  details?: string;
  resolved?: boolean;
}

export async function getResources(): Promise<Resource[]> {
  try {
    return await nocoGet<Resource>(TABLE_RESOURCES, { sort: '-discovered_at' });
  } catch (e) {
    console.warn("[NocoDB] getResources Fehler:", e);
    return [];
  }
}

export async function createResource(data: Partial<Resource>): Promise<Resource> {
  return nocoPost<Resource>(TABLE_RESOURCES, data as Record<string, unknown>);
}

export async function updateResourceStatus(
  id: string | number,
  status: ResourceStatus
): Promise<void> {
  await fetch(`${BASE}/api/v2/tables/${TABLE_RESOURCES}/records`, {
    method: 'PATCH',
    headers: { 'xc-token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Id: id, status }),
  });
}

export async function getErrorLogs(): Promise<ErrorLog[]> {
  try {
    return await nocoGet<ErrorLog>(TABLE_ERROR_LOGS, { sort: '-ts', limit: '500' });
  } catch (e) {
    console.warn("[NocoDB] getErrorLogs Fehler:", e);
    return [];
  }
}

export async function createErrorLog(data: Partial<ErrorLog>): Promise<void> {
  await nocoPost<ErrorLog>(TABLE_ERROR_LOGS, {
    ...data,
    ts: data.ts ?? new Date().toISOString(),
  } as Record<string, unknown>);
}

export async function resolveErrorLog(id: string | number): Promise<void> {
  await fetch(`${BASE}/api/v2/tables/${TABLE_ERROR_LOGS}/records`, {
    method: 'PATCH',
    headers: { 'xc-token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Id: id, resolved: true }),
  });
}
