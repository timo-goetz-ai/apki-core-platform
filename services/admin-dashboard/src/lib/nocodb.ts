/**
 * Data-Layer (Directus REST API) — Drop-in-Ersatz für den alten NocoDB-Client.
 *
 * Alle Exports bleiben identisch, intern wird jetzt Directus genutzt.
 *
 * Env-Vars (in Coolify):
 *   DIRECTUS_URL   → https://directus.automation-plus-ki.de
 *   DIRECTUS_TOKEN → statischer Admin-Token
 *
 * Legacy NOCODB_* Env-Vars werden als Fallback unterstützt.
 */

import {
  PROJEKTE_SEED,
  MCP_DIENSTE_SEED,
  AUDIT_SEED,
  type Projekt,
  type MCPDienst,
  type AuditEintrag,
} from "./mcp-plattform-data";

const BASE  = (process.env.DIRECTUS_URL ?? process.env.NOCODB_URL ?? "").replace(/\/$/, "");
const TOKEN = process.env.DIRECTUS_TOKEN ?? process.env.NOCODB_API_TOKEN ?? "";

export const isConfigured = () => !!TOKEN && !!BASE;

// ── Collection-Namen (Directus) ─────────────────────────────────────────────

const C = {
  workflows:             "100_workflows",
  agents:                "110_agents",
  subagents:             "120_subagents",
  agent_runs:            "130_agent_runs",
  prompts:               "200_prompts",
  rules:                 "210_rules",
  skills:                "220_skills",
  hooks:                 "230_hooks",
  mcp_configs:           "240_mcp_configs",
  plugins:               "250_plugins",
  cursor_configs:        "260_cursor_configs",
  trends:                "300_trends",
  sentiment:             "310_sentiment",
  content_opportunities: "320_content_opportunities",
  knowledge_items:       "330_knowledge_items",
  regulatory:            "340_regulatory",
  tools:                 "350_tools",
  social_proof:          "360_social_proof",
  content_pipeline:      "400_content_pipeline",
  templates:             "410_templates",
  media_assets:          "420_media_assets",
  brand_identity:        "430_brand_identity",
  publish_log:           "440_publish_log",
  clients:               "500_clients",
  tasks:                 "510_tasks",
  mobile_ingest:         "520_mobile_ingest",
} as const;

// ── Low-Level Fetch (Directus REST) ─────────────────────────────────────────

function authHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
}

interface DirectusListResponse<T> { data: T[]; meta?: { total_count?: number; filter_count?: number } }
interface DirectusItemResponse<T> { data: T }

async function dxGet<T>(collection: string, params?: Record<string, string>): Promise<T[]> {
  const url = new URL(`${BASE}/items/${collection}`);
  url.searchParams.set("limit", "-1");
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      // Translate NocoDB-style sort to Directus (both use -field, so mostly compatible)
      if (k === "sort") {
        // NocoDB: "-CreatedAt" → Directus: "-date_created" (built-in) or same field
        url.searchParams.set("sort", v.replace("CreatedAt", "date_created").replace("UpdatedAt", "date_updated"));
      } else if (k === "where") {
        // Convert NocoDB where to Directus filter
        // (field,op,value) → filter[field][_op]=value
        const m = v.match(/\((\w+),(eq|gt|gte|lt|lte|like),([^)]+)\)/);
        if (m) {
          const opMap: Record<string, string> = { eq: "_eq", gt: "_gt", gte: "_gte", lt: "_lt", lte: "_lte", like: "_contains" };
          url.searchParams.set(`filter[${m[1]}][${opMap[m[2]] ?? "_eq"}]`, m[3]);
        }
      } else if (k === "limit") {
        url.searchParams.set("limit", v);
      } else if (k === "offset") {
        url.searchParams.set("offset", v);
      } else {
        url.searchParams.set(k, v);
      }
    }
  }

  const res = await fetch(url.toString(), {
    headers: authHeaders(),
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Directus GET ${collection}: ${res.status}`);
  const json = (await res.json()) as DirectusListResponse<T>;
  return json.data ?? [];
}

async function dxPost<T>(collection: string, data: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}/items/${collection}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Directus POST ${collection}: ${res.status}`);
  const json = (await res.json()) as DirectusItemResponse<T>;
  return json.data;
}

async function dxPatch<T>(collection: string, id: number | string, data: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}/items/${collection}/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Directus PATCH ${collection}/${id}: ${res.status}`);
  const json = (await res.json()) as DirectusItemResponse<T>;
  return json.data;
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

// ── Public API (identische Exports) ─────────────────────────────────────────

// MCP-Plattform tables (use seed data since these aren't in Directus yet)
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

// Map Directus lowercase fields to expected NocoAgent format
function mapDxAgent(r: Record<string, unknown>): NocoAgent {
  return {
    Id:              (r.id as number) ?? 0,
    Name:            (r.name as string) ?? (r.Name as string) ?? "",
    Typ:             (r.typ as string) ?? (r.Typ as string) ?? "",
    Model:           (r.model as string) ?? (r.Model as string) ?? "",
    Webhook_URL:     (r.webhook_url as string) ?? (r.Webhook_URL as string),
    Status:          (r.status as string) ?? (r.Status as string) ?? "idle",
    Beschreibung:    (r.beschreibung as string) ?? (r.Beschreibung as string),
    Layer:           (r.layer as string) ?? (r.Layer as string),
    Phase:           (r.phase as string) ?? (r.Phase as string) ?? null,
    n8n_workflow_id: (r.n8n_workflow_id as string) ?? null,
    CreatedAt:       (r.date_created as string) ?? (r.CreatedAt as string),
    UpdatedAt:       (r.date_updated as string) ?? (r.UpdatedAt as string) ?? null,
  };
}

export async function getAgents(): Promise<NocoAgent[]> {
  try {
    const rows = await dxGet<Record<string, unknown>>(C.agents, { sort: "phase" });
    return rows.map(mapDxAgent);
  } catch (e) {
    console.warn("[Directus] getAgents Fehler:", e);
    return [];
  }
}

export async function updateAgent(id: number | string, patch: NocoAgentPatch): Promise<void> {
  if (!TOKEN) throw new Error("DIRECTUS_TOKEN nicht konfiguriert");
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined) body[k.toLowerCase()] = v;
  }
  await dxPatch(C.agents, id, body);
}

export async function getTasks(): Promise<Record<string, unknown>[]> {
  try { return await dxGet(C.tasks); } catch (e) { console.warn("[Directus] getTasks:", e); return []; }
}

export async function getPrompts(): Promise<Record<string, unknown>[]> {
  try { return await dxGet(C.prompts); } catch (e) { console.warn("[Directus] getPrompts:", e); return []; }
}

export async function getKnowledgeItems(): Promise<Record<string, unknown>[]> {
  try { return await dxGet(C.knowledge_items); } catch (e) { console.warn("[Directus] getKnowledgeItems:", e); return []; }
}

export async function getWorkflowIndex(): Promise<Record<string, unknown>[]> {
  try { return await dxGet(C.workflows); } catch (e) { console.warn("[Directus] getWorkflowIndex:", e); return []; }
}

export async function createProject(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  return dxPost(C.clients, data);
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
  return dxPost<PipelineJob>(C.content_pipeline, {
    job_id: crypto.randomUUID(), topic: data.topic, category: data.category,
    tone: data.tone ?? 'professional', target_platforms: data.target_platforms ?? 'instagram,linkedin,blog',
    stage: 'text', status: 'idle', source_opportunity_id: data.source_opportunity_id ?? '',
    created_at: new Date().toISOString(),
  });
}

export async function getPipelineJobs(): Promise<PipelineJob[]> {
  try { return await dxGet<PipelineJob>(C.content_pipeline, { sort: "-date_created" }); }
  catch (e) { console.warn('[Directus] getPipelineJobs:', e); return []; }
}

export async function getPipelineJob(id: number): Promise<PipelineJob | null> {
  try {
    const res = await fetch(`${BASE}/items/${C.content_pipeline}/${id}`, {
      headers: authHeaders(), next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as DirectusItemResponse<PipelineJob>;
    return json.data ?? null;
  } catch { return null; }
}

export async function updatePipelineJob(id: number, data: Partial<Omit<PipelineJob, 'Id'>>): Promise<void> {
  await dxPatch(C.content_pipeline, id, data as Record<string, unknown>);
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
  try { return await dxGet<Resource>(C.tools, { sort: "-discovered_at" }); }
  catch (e) { console.warn("[Directus] getResources:", e); return []; }
}

export async function createResource(data: Partial<Resource>): Promise<Resource> {
  return dxPost<Resource>(C.tools, data as Record<string, unknown>);
}

export async function updateResourceStatus(id: string | number, status: ResourceStatus): Promise<void> {
  await dxPatch(C.tools, id, { status });
}

// Error logs — stored in agent_runs collection for now (no dedicated table yet)
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
  return dxPost<MediaAsset>(C.media_assets, { ...data, created_at: data.created_at ?? new Date().toISOString() } as Record<string, unknown>);
}

export async function getMediaAssets(pipelineJobId?: string): Promise<MediaAsset[]> {
  try {
    const params: Record<string, string> = { sort: "-date_created" };
    if (pipelineJobId) params.where = `(pipeline_job_id,eq,${pipelineJobId})`;
    return await dxGet<MediaAsset>(C.media_assets, params);
  } catch (e) { console.warn('[Directus] getMediaAssets:', e); return []; }
}

export async function updateMediaAssetStatus(id: number, status: AssetStatus): Promise<void> {
  await dxPatch(C.media_assets, id, { status });
}

// ── Publish Log ─────────────────────────────────────────────────────────────

export type PublishStatus = 'pending' | 'published' | 'failed' | 'scheduled';

export interface PublishLogEntry {
  Id?: number; id?: number; pipeline_job_id: string; platform: string;
  post_url?: string; postiz_post_id?: string; status: PublishStatus;
  error_message?: string; published_at?: string; created_at?: string;
}

export async function createPublishLogEntry(data: Omit<PublishLogEntry, 'Id'>): Promise<PublishLogEntry> {
  return dxPost<PublishLogEntry>(C.publish_log, { ...data, created_at: data.created_at ?? new Date().toISOString() } as Record<string, unknown>);
}

export async function getPublishLog(pipelineJobId?: string): Promise<PublishLogEntry[]> {
  try {
    const params: Record<string, string> = { sort: "-date_created" };
    if (pipelineJobId) params.where = `(pipeline_job_id,eq,${pipelineJobId})`;
    return await dxGet<PublishLogEntry>(C.publish_log, params);
  } catch (e) { console.warn('[Directus] getPublishLog:', e); return []; }
}

export async function updatePublishLogEntry(
  id: number, data: Partial<Pick<PublishLogEntry, 'status' | 'post_url' | 'postiz_post_id' | 'error_message' | 'published_at'>>
): Promise<void> {
  await dxPatch(C.publish_log, id, data as Record<string, unknown>);
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
  return dxPost<ContentPiece>(C.content_pipeline, {
    ...data, created_at: data.created_at ?? new Date().toISOString(), updated_at: new Date().toISOString(),
  } as Record<string, unknown>);
}

export async function getContentPieces(status?: ContentStatus, limit = 100): Promise<ContentPiece[]> {
  try {
    const params: Record<string, string> = { sort: "-date_created", limit: String(limit) };
    if (status) params.where = `(status,eq,${status})`;
    return await dxGet<ContentPiece>(C.content_pipeline, params);
  } catch (e) { console.warn('[Directus] getContentPieces:', e); return []; }
}

export async function getContentPiecesByDateRange(from: string, to: string): Promise<ContentPiece[]> {
  try {
    const url = new URL(`${BASE}/items/${C.content_pipeline}`);
    url.searchParams.set("filter[scheduled_at][_gte]", from);
    url.searchParams.set("filter[scheduled_at][_lte]", to);
    url.searchParams.set("sort", "scheduled_at");
    url.searchParams.set("limit", "500");
    const res = await fetch(url.toString(), { headers: authHeaders(), next: { revalidate: 0 } });
    if (!res.ok) return [];
    const json = (await res.json()) as DirectusListResponse<ContentPiece>;
    return json.data ?? [];
  } catch (e) { console.warn('[Directus] getContentPiecesByDateRange:', e); return []; }
}

export async function updateContentPiece(id: number, data: Partial<Omit<ContentPiece, 'Id'>>): Promise<void> {
  await dxPatch(C.content_pipeline, id, { ...data, updated_at: new Date().toISOString() } as Record<string, unknown>);
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
  return dxPost<AgentExecution>(C.agent_runs, {
    ...data, execution_id: data.execution_id ?? crypto.randomUUID(),
    started_at: data.started_at ?? new Date().toISOString(),
  } as Record<string, unknown>);
}

export async function finishAgentExecution(
  id: number, result: Pick<AgentExecution, 'status' | 'output_json' | 'error_message' | 'duration_ms' | 'tokens_used' | 'cost_usd'>
): Promise<void> {
  await dxPatch(C.agent_runs, id, { ...result, finished_at: new Date().toISOString() } as Record<string, unknown>);
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
  return dxPost<BatchJob>(C.content_pipeline, {
    batch_id: crypto.randomUUID(), topics_json: JSON.stringify(topics), category,
    steps_json: JSON.stringify(steps), status: 'queued', total_count: topics.length,
    done_count: 0, error_count: 0, scheduled_at: scheduledAt ?? null,
    created_at: new Date().toISOString(),
  } as Record<string, unknown>);
}

export async function getBatchJobs(limit = 50): Promise<BatchJob[]> {
  try { return await dxGet<BatchJob>(C.content_pipeline, { sort: "-date_created", limit: String(limit) }); }
  catch (e) { console.warn('[Directus] getBatchJobs:', e); return []; }
}

export async function updateBatchJob(
  id: number, data: Partial<Pick<BatchJob, 'status' | 'done_count' | 'error_count' | 'started_at' | 'finished_at'>>
): Promise<void> {
  await dxPatch(C.content_pipeline, id, data as Record<string, unknown>);
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
    await dxPost(C.agent_runs, {
      audit_id: crypto.randomUUID(), ts: new Date().toISOString(), result: 'ok', ...data,
    } as Record<string, unknown>);
  } catch (e) { console.warn('[Directus] logAuditTrail:', e); }
}
