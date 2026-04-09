/**
 * Data-Layer (Supabase PostgREST) — Drop-in-Ersatz für den alten Directus/NocoDB-Client.
 *
 * Alle Exports bleiben identisch, intern wird Supabase PostgREST genutzt.
 *
 * Env-Vars (in Coolify):
 *   SUPABASE_URL          → https://supabase.automation-plus-ki.de
 *   SUPABASE_SERVICE_KEY  → service_role JWT
 *
 * Legacy-Vars (DIRECTUS_URL, NOCODB_URL) werden als Fallback nicht mehr genutzt.
 */

import {
  PROJEKTE_SEED,
  MCP_DIENSTE_SEED,
  AUDIT_SEED,
  type Projekt,
  type MCPDienst,
  type AuditEintrag,
} from "./mcp-plattform-data";

const BASE  = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
const TOKEN = process.env.SUPABASE_SERVICE_KEY ?? "";

export const isConfigured = () => !!TOKEN && !!BASE;

// ── Tabellen-Namen (Supabase public schema) ─────────────────────────────────

const C = {
  workflows:             "workflows",
  agents:                "agents",
  subagents:             "subagents",
  agent_runs:            "agent_runs",
  prompts:               "prompts",
  rules:                 "rules",
  skills:                "skills",
  hooks:                 "hooks",
  mcp_configs:           "mcp_configs",
  plugins:               "plugins",
  cursor_configs:        "cursor_configs",
  trends:                "trends",
  sentiment:             "sentiment",
  content_opportunities: "content_opportunities",
  knowledge_items:       "knowledge_items",
  regulatory:            "regulatory",
  tools:                 "tools",
  social_proof:          "social_proof",
  content_pipeline:      "content_pipeline",
  templates:             "templates",
  media_assets:          "media_assets",
  brand_identity:        "brand_identity",
  publish_log:           "publish_log",
  clients:               "clients",
  tasks:                 "tasks",
  mobile_ingest:         "mobile_ingest",
  audit_trail:           "audit_trail",
} as const;

// ── Low-Level Fetch (Supabase PostgREST) ────────────────────────────────────

function authHeaders(): Record<string, string> {
  return {
    apikey: TOKEN,
    Authorization: `Bearer ${TOKEN}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

async function sbGet<T>(table: string, params?: Record<string, string>): Promise<T[]> {
  const url = new URL(`${BASE}/rest/v1/${table}`);
  url.searchParams.set("select", "*");

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (k === "sort") {
        // Convert Directus-style "-field" to PostgREST "field.desc"
        const parts = v.split(",").map((s) => {
          const desc = s.startsWith("-");
          const field = s.replace(/^-/, "").replace("date_created", "created_at").replace("date_updated", "updated_at");
          return `${field}.${desc ? "desc" : "asc"}`;
        });
        url.searchParams.set("order", parts.join(","));
      } else if (k === "where") {
        // Convert NocoDB-style "(field,op,value)" to PostgREST "field=op.value"
        const m = v.match(/\((\w+),(eq|gt|gte|lt|lte|like),([^)]+)\)/);
        if (m) {
          const opMap: Record<string, string> = { eq: "eq", gt: "gt", gte: "gte", lt: "lt", lte: "lte", like: "like" };
          url.searchParams.set(m[1], `${opMap[m[2]] ?? "eq"}.${m[3]}`);
        }
      } else if (k === "limit") {
        url.searchParams.set("limit", v);
      } else if (k === "offset") {
        url.searchParams.set("offset", v);
      } else if (k.startsWith("filter[")) {
        // Pass Directus-style filter params through as-is (unused path, safe fallback)
      } else {
        url.searchParams.set(k, v);
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Supabase GET ${table}: ${res.status} ${await res.text()}`);
  return (await res.json()) as T[];
}

async function sbPost<T>(table: string, data: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}/rest/v1/${table}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase POST ${table}: ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as T[];
  return rows[0];
}

async function sbPatch<T>(table: string, id: number | string, data: Record<string, unknown>): Promise<T> {
  const url = new URL(`${BASE}/rest/v1/${table}`);
  url.searchParams.set("id", `eq.${id}`);
  const res = await fetch(url.toString(), {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Supabase PATCH ${table}/${id}: ${res.status} ${await res.text()}`);
  const rows = (await res.json()) as T[];
  return rows[0];
}

async function sbGetOne<T>(table: string, id: number | string): Promise<T | null> {
  const url = new URL(`${BASE}/rest/v1/${table}`);
  url.searchParams.set("id", `eq.${id}`);
  url.searchParams.set("select", "*");
  const res = await fetch(url.toString(), {
    headers: { ...authHeaders(), Accept: "application/vnd.pgrst.object+json" },
    next: { revalidate: 0 },
  });
  if (res.status === 406 || res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as T;
}

// ── NocoDB ↔ App-Typen Mapping (unverändert) ───────────────────────────────

type NocoProjekt = {
  Id?: number; id?: string | number; name: string; emoji: string;
  beschreibung?: string; url?: string; status?: string; mcpServer?: string;
  owner?: string; uptime_pct?: number; requests_heute?: number; fehler_heute?: number;
};

type NocoMCPDienst = {
  Id?: number; id?: string | number; name: string; funktion: string;
  dienstEmoji?: string; projekt?: string; status?: string; seit?: string;
  zuverlaessigkeit?: number; healthScore?: number; lastCheck?: string; url?: string;
};

type NocoAudit = {
  Id?: number; id?: string | number; ts?: string; aktion: string;
  akteur: string; ressource: string; ergebnis?: string; details?: string;
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

// suppress unused warnings for mapping functions not yet wired to DB
void mapProjekt; void mapMCPDienst; void mapAudit;

// ── Public API (identische Exports) ─────────────────────────────────────────

// MCP-Plattform tables (seed data — not yet in Supabase)
export async function getProjekte(): Promise<Projekt[]>       { return PROJEKTE_SEED; }
export async function getMCPDienste(): Promise<MCPDienst[]>   { return MCP_DIENSTE_SEED; }

export async function createMCPDienst(data: { name: string; funktion: string; dienstEmoji: string; projekt: string }): Promise<MCPDienst> {
  const d: MCPDienst = {
    id: `d${Date.now()}`, name: data.name, funktion: data.funktion,
    dienstEmoji: data.dienstEmoji, projekt: data.projekt, status: "onboarding",
    seit: new Date().toISOString().split("T")[0], zuverlaessigkeit: 0, healthScore: 0, lastCheck: "",
  };
  MCP_DIENSTE_SEED.push(d);
  return d;
}

export async function getAudit(): Promise<AuditEintrag[]> {
  return [...AUDIT_SEED].sort((a, b) => b.ts.localeCompare(a.ts));
}

export async function createAudit(data: Omit<AuditEintrag, "id" | "ts">): Promise<void> {
  AUDIT_SEED.unshift({ id: `a${Date.now()}`, ts: new Date().toISOString(), ...data });
}

export function getNocoDBClient() {
  return { baseUrl: BASE, token: TOKEN };
}

// ── Agents ──────────────────────────────────────────────────────────────────

export interface NocoAgent {
  Id: number; id?: number;
  CreatedAt?: string; UpdatedAt?: string | null;
  Name: string; Typ: string; Model: string;
  Webhook_URL?: string; Status: string; Beschreibung?: string;
  Layer?: string; Phase?: string | null; n8n_workflow_id?: string | null;
}

export type NocoAgentPatch = Partial<Pick<NocoAgent, "Name" | "Typ" | "Model" | "Webhook_URL" | "Status" | "Beschreibung" | "Layer" | "n8n_workflow_id" | "Phase">>;

function mapSbAgent(r: Record<string, unknown>): NocoAgent {
  return {
    Id:              (r.id as number) ?? 0,
    Name:            (r.name as string) ?? "",
    Typ:             (r.typ as string) ?? "",
    Model:           (r.model as string) ?? "",
    Webhook_URL:     (r.webhook_url as string) ?? undefined,
    Status:          (r.status as string) ?? "idle",
    Beschreibung:    (r.beschreibung as string) ?? undefined,
    Layer:           (r.layer as string) ?? undefined,
    Phase:           (r.phase as string) ?? null,
    n8n_workflow_id: (r.n8n_workflow_id as string) ?? null,
    CreatedAt:       (r.created_at as string) ?? undefined,
    UpdatedAt:       (r.updated_at as string) ?? null,
  };
}

export async function getAgents(): Promise<NocoAgent[]> {
  try {
    const rows = await sbGet<Record<string, unknown>>(C.agents, { sort: "phase" });
    return rows.map(mapSbAgent);
  } catch (e) {
    console.warn("[Supabase] getAgents Fehler:", e);
    return [];
  }
}

export async function updateAgent(id: number | string, patch: NocoAgentPatch): Promise<void> {
  if (!TOKEN) throw new Error("SUPABASE_SERVICE_KEY nicht konfiguriert");
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) body[k.toLowerCase()] = v;
  }
  await sbPatch(C.agents, id, body);
}

export async function getTasks(): Promise<Record<string, unknown>[]> {
  try { return await sbGet(C.tasks); } catch (e) { console.warn("[Supabase] getTasks:", e); return []; }
}

export async function getPrompts(): Promise<Record<string, unknown>[]> {
  try { return await sbGet(C.prompts); } catch (e) { console.warn("[Supabase] getPrompts:", e); return []; }
}

export async function getKnowledgeItems(): Promise<Record<string, unknown>[]> {
  try { return await sbGet(C.knowledge_items); } catch (e) { console.warn("[Supabase] getKnowledgeItems:", e); return []; }
}

export async function getWorkflowIndex(): Promise<Record<string, unknown>[]> {
  try { return await sbGet(C.workflows); } catch (e) { console.warn("[Supabase] getWorkflowIndex:", e); return []; }
}

export async function createProject(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  return sbPost(C.clients, data);
}

// ── Content Pipeline ────────────────────────────────────────────────────────

export interface PipelineJob {
  Id?: number; id?: number;
  job_id?: string; topic: string; category: string; tone?: string;
  target_platforms?: string; stage: 'text' | 'image' | 'voice' | 'publish' | 'done';
  status: 'idle' | 'running' | 'done' | 'error';
  content_text?: string; image_prompt?: string; image_url?: string;
  voice_script?: string; voice_url?: string; blog_id?: string;
  source_opportunity_id?: string; error_message?: string;
  steps_requested?: string; published_at?: string; created_at?: string;
}

export async function createPipelineJob(
  data: Pick<PipelineJob, 'topic' | 'category'> & { tone?: string; target_platforms?: string; source_opportunity_id?: string }
): Promise<PipelineJob> {
  return sbPost<PipelineJob>(C.content_pipeline, {
    job_id: crypto.randomUUID(), topic: data.topic, category: data.category,
    tone: data.tone ?? 'professional', target_platforms: data.target_platforms ?? 'instagram,linkedin,blog',
    stage: 'text', status: 'idle', source_opportunity_id: data.source_opportunity_id ?? '',
    created_at: new Date().toISOString(),
  });
}

export async function getPipelineJobs(): Promise<PipelineJob[]> {
  try { return await sbGet<PipelineJob>(C.content_pipeline, { sort: "-created_at" }); }
  catch (e) { console.warn('[Supabase] getPipelineJobs:', e); return []; }
}

export async function getPipelineJob(id: number): Promise<PipelineJob | null> {
  try { return await sbGetOne<PipelineJob>(C.content_pipeline, id); }
  catch { return null; }
}

export async function updatePipelineJob(id: number, data: Partial<Omit<PipelineJob, 'Id'>>): Promise<void> {
  await sbPatch(C.content_pipeline, id, data as Record<string, unknown>);
}

// ── Resource Registry ───────────────────────────────────────────────────────

export type ResourceType   = 'docker' | 'model' | 'coolify' | 'github' | 'mcp';
export type ResourceStatus = 'discovered' | 'approved' | 'blocked';

export interface Resource {
  Id?: number | string; id?: number | string;
  name: string; type: ResourceType; source: string;
  status: ResourceStatus; metadata?: string; discovered_at: string; approved_by?: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'critical';

export interface ErrorLog {
  Id?: number | string; id?: number | string;
  ts: string; service: string; level: LogLevel;
  message: string; details?: string; resolved?: boolean;
}

export async function getResources(): Promise<Resource[]> {
  try { return await sbGet<Resource>(C.tools, { sort: "-discovered_at" }); }
  catch (e) { console.warn("[Supabase] getResources:", e); return []; }
}

export async function createResource(data: Partial<Resource>): Promise<Resource> {
  return sbPost<Resource>(C.tools, data as Record<string, unknown>);
}

export async function updateResourceStatus(id: string | number, status: ResourceStatus): Promise<void> {
  await sbPatch(C.tools, id, { status });
}

// Error logs — stub (no dedicated table yet)
export async function getErrorLogs(): Promise<ErrorLog[]> { return []; }
export async function createErrorLog(_data: Partial<ErrorLog>): Promise<void> {}
export async function resolveErrorLog(_id: string | number): Promise<void> {}

// ── Media Assets ────────────────────────────────────────────────────────────

export type AssetType     = 'image' | 'audio' | 'video' | 'text' | 'pdf';
export type AssetStatus   = 'processing' | 'ready' | 'published' | 'archived';
export type SourceService = 'picsart' | 'fishaudio' | 'gemini' | 'claude' | 'llama' | 'n8n';

export interface MediaAsset {
  Id?: number; id?: number; asset_id?: string; source_service: SourceService;
  asset_type: AssetType; s3_url: string; cdn_url?: string; file_name: string;
  file_size_kb?: number; mime_type: string; pipeline_job_id?: string;
  prompt_used?: string; generation_cost?: number; status: AssetStatus;
  platforms_used?: string; created_at?: string;
}

export async function createMediaAsset(data: Omit<MediaAsset, 'Id'>): Promise<MediaAsset> {
  return sbPost<MediaAsset>(C.media_assets, { ...data, created_at: data.created_at ?? new Date().toISOString() } as Record<string, unknown>);
}

export async function getMediaAssets(pipelineJobId?: string): Promise<MediaAsset[]> {
  try {
    const params: Record<string, string> = { sort: "-created_at" };
    if (pipelineJobId) params.pipeline_job_id = `eq.${pipelineJobId}`;
    return await sbGet<MediaAsset>(C.media_assets, params);
  } catch (e) { console.warn('[Supabase] getMediaAssets:', e); return []; }
}

export async function updateMediaAssetStatus(id: number, status: AssetStatus): Promise<void> {
  await sbPatch(C.media_assets, id, { status });
}

// ── Publish Log ─────────────────────────────────────────────────────────────

export type PublishStatus = 'pending' | 'published' | 'failed' | 'scheduled';

export interface PublishLogEntry {
  Id?: number; id?: number; pipeline_job_id: string; platform: string;
  post_url?: string; postiz_post_id?: string; status: PublishStatus;
  error_message?: string; published_at?: string; created_at?: string;
}

export async function createPublishLogEntry(data: Omit<PublishLogEntry, 'Id'>): Promise<PublishLogEntry> {
  return sbPost<PublishLogEntry>(C.publish_log, { ...data, created_at: data.created_at ?? new Date().toISOString() } as Record<string, unknown>);
}

export async function getPublishLog(pipelineJobId?: string): Promise<PublishLogEntry[]> {
  try {
    const params: Record<string, string> = { sort: "-created_at" };
    if (pipelineJobId) params.pipeline_job_id = `eq.${pipelineJobId}`;
    return await sbGet<PublishLogEntry>(C.publish_log, params);
  } catch (e) { console.warn('[Supabase] getPublishLog:', e); return []; }
}

export async function updatePublishLogEntry(
  id: number, data: Partial<Pick<PublishLogEntry, 'status' | 'post_url' | 'postiz_post_id' | 'error_message' | 'published_at'>>
): Promise<void> {
  await sbPatch(C.publish_log, id, data as Record<string, unknown>);
}

// ── Content Pieces ──────────────────────────────────────────────────────────

export type ContentStatus = 'idea' | 'research' | 'draft' | 'review' | 'approved' | 'published' | 'archived';
export type ContentCategory = 'KI-Tools' | 'Tutorial' | 'Review' | 'News' | 'Allgemein';

export interface ContentPiece {
  Id?: number; id?: number; piece_id: string; title: string; topic?: string;
  category?: ContentCategory; status: ContentStatus; content_text?: string;
  excerpt?: string; seo_keywords?: string; image_url?: string; audio_url?: string;
  gdrive_folder_id?: string; gdrive_doc_id?: string; source_opportunity_id?: string;
  pipeline_job_id?: string; target_platforms?: string; scheduled_at?: string;
  published_at?: string; created_at?: string; updated_at?: string;
}

export async function createContentPiece(data: Omit<ContentPiece, 'Id'>): Promise<ContentPiece> {
  return sbPost<ContentPiece>(C.content_pipeline, {
    ...data, created_at: data.created_at ?? new Date().toISOString(), updated_at: new Date().toISOString(),
  } as Record<string, unknown>);
}

export async function getContentPieces(status?: ContentStatus, limit = 100): Promise<ContentPiece[]> {
  try {
    const params: Record<string, string> = { sort: "-created_at", limit: String(limit) };
    if (status) params.status = `eq.${status}`;
    return await sbGet<ContentPiece>(C.content_pipeline, params);
  } catch (e) { console.warn('[Supabase] getContentPieces:', e); return []; }
}

export async function getContentPiecesByDateRange(from: string, to: string): Promise<ContentPiece[]> {
  try {
    const url = new URL(`${BASE}/rest/v1/${C.content_pipeline}`);
    url.searchParams.set("select", "*");
    url.searchParams.set("scheduled_at", `gte.${from}`);
    url.searchParams.set("order", "scheduled_at.asc");
    url.searchParams.set("limit", "500");
    // Add upper bound via header (PostgREST supports multiple filters for same col via Range headers)
    // Simplification: fetch all from `from` and filter in-memory for `to`
    const res = await fetch(url.toString(), { headers: authHeaders(), next: { revalidate: 0 } });
    if (!res.ok) return [];
    const rows = (await res.json()) as ContentPiece[];
    return rows.filter((r) => !r.scheduled_at || r.scheduled_at <= to);
  } catch (e) { console.warn('[Supabase] getContentPiecesByDateRange:', e); return []; }
}

export async function updateContentPiece(id: number, data: Partial<Omit<ContentPiece, 'Id'>>): Promise<void> {
  await sbPatch(C.content_pipeline, id, { ...data, updated_at: new Date().toISOString() } as Record<string, unknown>);
}

// ── Agent Executions ────────────────────────────────────────────────────────

export type ExecutionStatus = 'started' | 'completed' | 'failed' | 'timeout';

export interface AgentExecution {
  Id?: number; id?: number; execution_id: string; agent_id: string;
  content_piece_id?: string; task_id?: string; status: ExecutionStatus;
  input_json?: string; output_json?: string; error_message?: string;
  duration_ms?: number; tokens_used?: number; cost_usd?: number;
  started_at: string; finished_at?: string;
}

export async function createAgentExecution(data: Omit<AgentExecution, 'Id'>): Promise<AgentExecution> {
  return sbPost<AgentExecution>(C.agent_runs, {
    ...data, execution_id: data.execution_id ?? crypto.randomUUID(),
    started_at: data.started_at ?? new Date().toISOString(),
  } as Record<string, unknown>);
}

export async function finishAgentExecution(
  id: number, result: Pick<AgentExecution, 'status' | 'output_json' | 'error_message' | 'duration_ms' | 'tokens_used' | 'cost_usd'>
): Promise<void> {
  await sbPatch(C.agent_runs, id, { ...result, finished_at: new Date().toISOString() } as Record<string, unknown>);
}

// ── Batch Jobs ──────────────────────────────────────────────────────────────

export type BatchStatus = 'queued' | 'running' | 'partial' | 'done' | 'failed';

export interface BatchJob {
  Id?: number; id?: number; batch_id: string; topics_json: string;
  category: string; steps_json: string; status: BatchStatus;
  total_count: number; done_count: number; error_count: number;
  scheduled_at?: string; started_at?: string; finished_at?: string; created_at?: string;
}

export async function createBatchJob(topics: string[], category: string, steps: string[], scheduledAt?: string): Promise<BatchJob> {
  return sbPost<BatchJob>(C.content_pipeline, {
    batch_id: crypto.randomUUID(), topics_json: JSON.stringify(topics), category,
    steps_json: JSON.stringify(steps), status: 'queued', total_count: topics.length,
    done_count: 0, error_count: 0, scheduled_at: scheduledAt ?? null,
    created_at: new Date().toISOString(),
  } as Record<string, unknown>);
}

export async function getBatchJobs(limit = 50): Promise<BatchJob[]> {
  try { return await sbGet<BatchJob>(C.content_pipeline, { sort: "-created_at", limit: String(limit) }); }
  catch (e) { console.warn('[Supabase] getBatchJobs:', e); return []; }
}

export async function updateBatchJob(
  id: number, data: Partial<Pick<BatchJob, 'status' | 'done_count' | 'error_count' | 'started_at' | 'finished_at'>>
): Promise<void> {
  await sbPatch(C.content_pipeline, id, data as Record<string, unknown>);
}

// ── Audit Trail ─────────────────────────────────────────────────────────────

export type AuditResult = 'ok' | 'error' | 'blocked';

export interface AuditEntry {
  audit_id: string; ts: string; actor: string; action: string;
  resource_type: string; resource_id: string;
  before_json?: string; after_json?: string; result: AuditResult;
}

export async function logAuditTrail(data: {
  actor: string; action: string; resource_type: string; resource_id: string;
  result?: AuditResult; after_json?: string; before_json?: string;
}): Promise<void> {
  if (!TOKEN) return;
  try {
    await sbPost(C.audit_trail, {
      audit_id: crypto.randomUUID(), ts: new Date().toISOString(), result: 'ok', ...data,
    } as Record<string, unknown>);
  } catch (e) { console.warn('[Supabase] logAuditTrail:', e); }
}
