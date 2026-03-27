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

// ── Content Base (pmox01979j55xbd) — verifizierte IDs 2026-03-27 ─────────────
const CONTENT_BASE_ID = process.env.NOCODB_CONTENT_BASE_ID ?? 'pmox01979j55xbd';
void CONTENT_BASE_ID; // suppress unused warning

// Bestehende Tabellen in Content Base
const TABLE_AGENTS         = process.env.NOCODB_AGENTS_TABLE_ID         ?? 'm8c0rpjwx5d4bu2';
const TABLE_TASKS          = process.env.NOCODB_TASKS_TABLE_ID          ?? 'mjd39ltx4bq27qj';
const TABLE_PROMPTS        = process.env.NOCODB_PROMPTS_TABLE_ID        ?? 'mlw20rrihtkbmew';
const TABLE_KNOWLEDGE      = process.env.NOCODB_KNOWLEDGE_TABLE_ID      ?? 'mdnmls6h5zfrio1';
const TABLE_PROJEKTE_NEW   = process.env.NOCODB_PROJEKTE_TABLE_ID       ?? 'mkbaqjiz5a2zaz4';
const TABLE_LEADS          = process.env.NOCODB_LEADS_TABLE_ID          ?? 'mvjlin5dazwp69x';
const TABLE_WORKFLOW_INDEX = process.env.NOCODB_WORKFLOW_INDEX_TABLE_ID ?? 'mfz43ghxesvn1yy';
const TABLE_MCP_CONFIGS    = process.env.NOCODB_MCP_CONFIGS_TABLE_ID    ?? 'mk7cfi7stnj0hpc';

// Neue Content-Infrastruktur-Tabellen (erstellt 2026-03-27)
const TABLE_CONTENT_PIECES    = process.env.NOCODB_CONTENT_PIECES_TABLE_ID    ?? 'mm1ssn0luruhzyx';
const TABLE_AGENT_EXECUTIONS  = process.env.NOCODB_AGENT_EXECUTIONS_TABLE_ID  ?? 'm02lg0vu1f81bh9';
const TABLE_CONTENT_VERSIONS  = process.env.NOCODB_CONTENT_VERSIONS_TABLE_ID  ?? 'mzzemannneaes9g';
const TABLE_DATA_SOURCES      = process.env.NOCODB_DATA_SOURCES_TABLE_ID      ?? 'me9zmh0uxnbzn5c';
const TABLE_AUDIT_TRAIL_NEW   = process.env.NOCODB_AUDIT_TRAIL_TABLE_ID       ?? 'mgeh1epw96tgx3u';
const TABLE_BATCH_JOBS        = process.env.NOCODB_BATCH_JOBS_TABLE_ID        ?? 'mg4p0eux8onz3nq';

// suppress unused-variable warnings for IDs not yet used in queries
void TABLE_MCP_CONFIGS;
void TABLE_LEADS;
void TABLE_DATA_SOURCES;

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

const TABLE_CONTENT_PIPELINE = process.env.NOCODB_CONTENT_PIPELINE_TABLE_ID ?? 'mgjsuwl4jwlyhdc';

export interface PipelineJob {
  Id?: number;
  job_id?: string;
  topic: string;
  category: string;
  tone?: string;
  target_platforms?: string;
  stage: 'text' | 'image' | 'voice' | 'publish' | 'done';
  status: 'idle' | 'running' | 'done' | 'error';
  content_text?: string;
  image_prompt?: string;
  image_url?: string;
  voice_script?: string;
  voice_url?: string;
  blog_id?: string;
  source_opportunity_id?: string;
  error_message?: string;
  steps_requested?: string;
  published_at?: string;
  created_at?: string;
}

export async function createPipelineJob(
  data: Pick<PipelineJob, 'topic' | 'category'> & { tone?: string; target_platforms?: string; source_opportunity_id?: string }
): Promise<PipelineJob> {
  if (!TOKEN) throw new Error('NOCODB_API_TOKEN nicht konfiguriert');
  return nocoPost<PipelineJob>(TABLE_CONTENT_PIPELINE, {
    job_id:               crypto.randomUUID(),
    topic:                data.topic,
    category:             data.category,
    tone:                 data.tone ?? 'professional',
    target_platforms:     data.target_platforms ?? 'instagram,linkedin,blog',
    stage:                'text',
    status:               'idle',
    source_opportunity_id: data.source_opportunity_id ?? '',
    created_at:           new Date().toISOString(),
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
  if (!TOKEN) return;
  await fetch(`${BASE}/api/v2/tables/${TABLE_CONTENT_PIPELINE}/records`, {
    method: 'PATCH',
    headers: { 'xc-token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Id: id, ...data }),
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

// ── Media Assets ──────────────────────────────────────────────────────────────

const TABLE_MEDIA_ASSETS = process.env.NOCODB_MEDIA_ASSETS_TABLE_ID ?? 'msxl4hvogh62u4u';

export type AssetType     = 'image' | 'audio' | 'video' | 'text' | 'pdf';
export type AssetStatus   = 'processing' | 'ready' | 'published' | 'archived';
export type SourceService = 'picsart' | 'fishaudio' | 'gemini' | 'claude' | 'llama' | 'n8n';

export interface MediaAsset {
  Id?:              number;
  asset_id?:        string;
  source_service:   SourceService;
  asset_type:       AssetType;
  s3_url:           string;
  cdn_url?:         string;
  file_name:        string;
  file_size_kb?:    number;
  mime_type:        string;
  pipeline_job_id?: string;
  prompt_used?:     string;
  generation_cost?: number;
  status:           AssetStatus;
  platforms_used?:  string;
  created_at?:      string;
}

export async function createMediaAsset(data: Omit<MediaAsset, 'Id'>): Promise<MediaAsset> {
  return nocoPost<MediaAsset>(TABLE_MEDIA_ASSETS, {
    ...data,
    created_at: data.created_at ?? new Date().toISOString(),
  } as Record<string, unknown>);
}

export async function getMediaAssets(pipelineJobId?: string): Promise<MediaAsset[]> {
  try {
    const params: Record<string, string> = { sort: '-created_at' };
    if (pipelineJobId) params.where = `(pipeline_job_id,eq,${pipelineJobId})`;
    return await nocoGet<MediaAsset>(TABLE_MEDIA_ASSETS, params);
  } catch (e) {
    console.warn('[NocoDB] getMediaAssets Fehler:', e);
    return [];
  }
}

export async function updateMediaAssetStatus(id: number, status: AssetStatus): Promise<void> {
  await fetch(`${BASE}/api/v2/tables/${TABLE_MEDIA_ASSETS}/records`, {
    method: 'PATCH',
    headers: { 'xc-token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Id: id, status }),
  });
}

// ── Publish Log ───────────────────────────────────────────────────────────────

const TABLE_PUBLISH_LOG = process.env.NOCODB_PUBLISH_LOG_TABLE_ID ?? 'mcwxjf0na0ixkah';

export type PublishStatus = 'pending' | 'published' | 'failed' | 'scheduled';

export interface PublishLogEntry {
  Id?:              number;
  pipeline_job_id:  string;
  platform:         string;
  post_url?:        string;
  postiz_post_id?:  string;
  status:           PublishStatus;
  error_message?:   string;
  published_at?:    string;
  created_at?:      string;
}

export async function createPublishLogEntry(data: Omit<PublishLogEntry, 'Id'>): Promise<PublishLogEntry> {
  return nocoPost<PublishLogEntry>(TABLE_PUBLISH_LOG, {
    ...data,
    created_at: data.created_at ?? new Date().toISOString(),
  } as Record<string, unknown>);
}

export async function getPublishLog(pipelineJobId?: string): Promise<PublishLogEntry[]> {
  try {
    const params: Record<string, string> = { sort: '-created_at' };
    if (pipelineJobId) params.where = `(pipeline_job_id,eq,${pipelineJobId})`;
    return await nocoGet<PublishLogEntry>(TABLE_PUBLISH_LOG, params);
  } catch (e) {
    console.warn('[NocoDB] getPublishLog Fehler:', e);
    return [];
  }
}

export async function updatePublishLogEntry(
  id: number,
  data: Partial<Pick<PublishLogEntry, 'status' | 'post_url' | 'postiz_post_id' | 'error_message' | 'published_at'>>
): Promise<void> {
  await fetch(`${BASE}/api/v2/tables/${TABLE_PUBLISH_LOG}/records`, {
    method: 'PATCH',
    headers: { 'xc-token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Id: id, ...data }),
  });
}

// ── Content Pieces ────────────────────────────────────────────────────────────

export type ContentStatus =
  | 'idea' | 'research' | 'draft' | 'review'
  | 'approved' | 'published' | 'archived';

export type ContentCategory =
  | 'KI-Tools' | 'Tutorial' | 'Review' | 'News' | 'Allgemein';

export interface ContentPiece {
  Id?: number;
  piece_id: string;
  title: string;
  topic?: string;
  category?: ContentCategory;
  status: ContentStatus;
  content_text?: string;
  excerpt?: string;
  seo_keywords?: string;
  image_url?: string;
  audio_url?: string;
  gdrive_folder_id?: string;
  gdrive_doc_id?: string;
  source_opportunity_id?: string;
  pipeline_job_id?: string;
  target_platforms?: string;
  scheduled_at?: string;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
}

export async function createContentPiece(
  data: Omit<ContentPiece, 'Id'>
): Promise<ContentPiece> {
  return nocoPost<ContentPiece>(TABLE_CONTENT_PIECES, {
    ...data,
    created_at: data.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as Record<string, unknown>);
}

export async function getContentPieces(
  status?: ContentStatus,
  limit = 100
): Promise<ContentPiece[]> {
  try {
    const params: Record<string, string> = {
      sort: '-created_at',
      limit: String(limit),
    };
    if (status) params.where = `(status,eq,${status})`;
    return await nocoGet<ContentPiece>(TABLE_CONTENT_PIECES, params);
  } catch (e) {
    console.warn('[NocoDB] getContentPieces Fehler:', e);
    return [];
  }
}

export async function getContentPiecesByDateRange(
  from: string,
  to: string
): Promise<ContentPiece[]> {
  try {
    return await nocoGet<ContentPiece>(TABLE_CONTENT_PIECES, {
      where: `(scheduled_at,gte,${from})~and(scheduled_at,lte,${to})`,
      sort: 'scheduled_at',
      limit: '500',
    });
  } catch (e) {
    console.warn('[NocoDB] getContentPiecesByDateRange Fehler:', e);
    return [];
  }
}

export async function updateContentPiece(
  id: number,
  data: Partial<Omit<ContentPiece, 'Id'>>
): Promise<void> {
  await fetch(`${BASE}/api/v2/tables/${TABLE_CONTENT_PIECES}/records`, {
    method: 'PATCH',
    headers: { 'xc-token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Id: id, ...data, updated_at: new Date().toISOString() }),
  });
}

// ── Agent Executions ──────────────────────────────────────────────────────────

export type ExecutionStatus = 'started' | 'completed' | 'failed' | 'timeout';

export interface AgentExecution {
  Id?: number;
  execution_id: string;
  agent_id: string;
  content_piece_id?: string;
  task_id?: string;
  status: ExecutionStatus;
  input_json?: string;
  output_json?: string;
  error_message?: string;
  duration_ms?: number;
  tokens_used?: number;
  cost_usd?: number;
  started_at: string;
  finished_at?: string;
}

export async function createAgentExecution(
  data: Omit<AgentExecution, 'Id'>
): Promise<AgentExecution> {
  return nocoPost<AgentExecution>(TABLE_AGENT_EXECUTIONS, {
    ...data,
    execution_id: data.execution_id ?? crypto.randomUUID(),
    started_at: data.started_at ?? new Date().toISOString(),
  } as Record<string, unknown>);
}

export async function finishAgentExecution(
  id: number,
  result: Pick<AgentExecution, 'status' | 'output_json' | 'error_message' | 'duration_ms' | 'tokens_used' | 'cost_usd'>
): Promise<void> {
  await fetch(`${BASE}/api/v2/tables/${TABLE_AGENT_EXECUTIONS}/records`, {
    method: 'PATCH',
    headers: { 'xc-token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Id: id, ...result, finished_at: new Date().toISOString() }),
  });
}

// ── Batch Jobs ────────────────────────────────────────────────────────────────

export type BatchStatus = 'queued' | 'running' | 'partial' | 'done' | 'failed';

export interface BatchJob {
  Id?: number;
  batch_id: string;
  topics_json: string;
  category: string;
  steps_json: string;
  status: BatchStatus;
  total_count: number;
  done_count: number;
  error_count: number;
  scheduled_at?: string;
  started_at?: string;
  finished_at?: string;
  created_at?: string;
}

export async function createBatchJob(
  topics: string[],
  category: string,
  steps: string[],
  scheduledAt?: string
): Promise<BatchJob> {
  return nocoPost<BatchJob>(TABLE_BATCH_JOBS, {
    batch_id:    crypto.randomUUID(),
    topics_json: JSON.stringify(topics),
    category,
    steps_json:  JSON.stringify(steps),
    status:      'queued',
    total_count: topics.length,
    done_count:  0,
    error_count: 0,
    scheduled_at: scheduledAt ?? null,
    created_at:  new Date().toISOString(),
  } as Record<string, unknown>);
}

export async function getBatchJobs(limit = 50): Promise<BatchJob[]> {
  try {
    return await nocoGet<BatchJob>(TABLE_BATCH_JOBS, {
      sort: '-created_at',
      limit: String(limit),
    });
  } catch (e) {
    console.warn('[NocoDB] getBatchJobs Fehler:', e);
    return [];
  }
}

export async function updateBatchJob(
  id: number,
  data: Partial<Pick<BatchJob, 'status' | 'done_count' | 'error_count' | 'started_at' | 'finished_at'>>
): Promise<void> {
  await fetch(`${BASE}/api/v2/tables/${TABLE_BATCH_JOBS}/records`, {
    method: 'PATCH',
    headers: { 'xc-token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ Id: id, ...data }),
  });
}

// ── Audit Trail ───────────────────────────────────────────────────────────────

export type AuditResult = 'ok' | 'error' | 'blocked';

export interface AuditEntry {
  audit_id: string;
  ts: string;
  actor: string;
  action: string;
  resource_type: string;
  resource_id: string;
  before_json?: string;
  after_json?: string;
  result: AuditResult;
}

export async function logAuditTrail(data: {
  actor: string;
  action: string;
  resource_type: string;
  resource_id: string;
  result?: AuditResult;
  after_json?: string;
  before_json?: string;
}): Promise<void> {
  if (!TOKEN || !TABLE_AUDIT_TRAIL_NEW) return;
  try {
    await nocoPost(TABLE_AUDIT_TRAIL_NEW, {
      audit_id:      crypto.randomUUID(),
      ts:            new Date().toISOString(),
      result:        'ok',
      ...data,
    } as Record<string, unknown>);
  } catch (e) {
    console.warn('[NocoDB] logAuditTrail Fehler:', e);
  }
}
