import { embedText } from '@/lib/embeddings';
import { qdrantEnsureCollection, qdrantRetrieveByIds, qdrantUpsertPoint } from '@/lib/qdrant-rest';
import { fabrikDeterministicPointId } from '@/lib/fabrik-id';
import { logAuditTrail } from '@/lib/nocodb';
import { FABRIK_STATIONS } from '@/lib/fabrik-config';

const COLLECTION = process.env.QDRANT_FABRIK_COLLECTION ?? 'aios_fabrik';
const NOCO_TABLE = process.env.NOCODB_FABRIK_TABLE_ID ?? process.env.NOCODB_PROJEKTE_TABLE_ID ?? 'mkbaqjiz5a2zaz4';

const BASE = process.env.NOCODB_URL ?? '';
const TOKEN = process.env.NOCODB_API_TOKEN ?? '';

/** Dedizierte Spalten in NocoDB — siehe docs/setup/NOCODB_FABRIK_SNAPSHOTS_TABLE.md */
const NOCO_EXTENDED =
  process.env.FABRIK_NOCODB_EXTENDED_COLUMNS === '1' || process.env.FABRIK_NOCODB_EXTENDED_COLUMNS === 'true';

async function nocoPostRow(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!TOKEN || !NOCO_TABLE) throw new Error('NOCODB_API_TOKEN oder NOCODB_FABRIK_TABLE_ID fehlt');
  const res = await fetch(`${BASE}/api/v2/tables/${NOCO_TABLE}/records`, {
    method: 'POST',
    headers: { 'xc-token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`NocoDB POST ${res.status}: ${t.slice(0, 600)}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

async function nocoPatchRow(recordId: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!TOKEN || !NOCO_TABLE) throw new Error('NOCODB_API_TOKEN oder NOCODB_FABRIK_TABLE_ID fehlt');
  const parsed = Number(recordId);
  const body =
    Number.isFinite(parsed) && parsed > 0 && String(parsed) === recordId.trim()
      ? { Id: parsed, ...data }
      : { Id: recordId, ...data };
  const res = await fetch(`${BASE}/api/v2/tables/${NOCO_TABLE}/records`, {
    method: 'PATCH',
    headers: { 'xc-token': TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`NocoDB PATCH ${res.status}: ${t.slice(0, 600)}`);
  }
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (json && typeof json === 'object' && ('Id' in json || 'id' in json)) return json;
  return { ...body };
}

export interface FabrikIndexInput {
  title: string;
  owner?: string;
  description?: string;
  notes?: string;
  snapshot_key?: string;
}

export interface FabrikIndexResult {
  qdrant_collection: string;
  qdrant_point_id: string;
  embed_model: string;
  nocodb: Record<string, unknown>;
  reindexed: boolean;
  nocodb_extended: boolean;
}

function buildEmbedText(input: FabrikIndexInput): string {
  const stationLines = FABRIK_STATIONS.map(
    (s) => `${s.title}: ${s.metaphor}. Fokus: ${s.agentFocus.join(', ')}.`
  ).join('\n');
  return [
    `Fabrik / Projekt: ${input.title}`,
    input.owner ? `Owner: ${input.owner}` : '',
    input.description ?? '',
    input.notes ?? '',
    '--- Stationen ---',
    stationLines,
  ]
    .filter(Boolean)
    .join('\n');
}

function buildNocoRowPayload(
  input: FabrikIndexInput,
  metaJson: string,
  qdrantPointId: string,
  model: string,
  collection: string,
  key: string | undefined
): Record<string, unknown> {
  const beschreibungParts = [input.description ?? '', input.notes ?? ''].filter(Boolean);
  if (!NOCO_EXTENDED) beschreibungParts.push(`---meta---\n${metaJson}`);

  const row: Record<string, unknown> = {
    Name: input.title,
    Beschreibung: beschreibungParts.join('\n\n'),
    emoji: '🏭',
    status: 'entwurf',
    ...(input.owner ? { owner: input.owner } : {}),
  };

  if (NOCO_EXTENDED) {
    Object.assign(row, {
      qdrant_point_id: qdrantPointId,
      qdrant_collection: collection,
      embed_model: model,
      snapshot_key: key ?? '',
    });
  }

  return row;
}

function payloadNocodbId(p: Record<string, unknown> | undefined): string {
  if (!p) return '';
  const raw = p.nocodb_id;
  if (typeof raw === 'string' && raw) return raw;
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw);
  return '';
}

export async function indexFabrikToVectorAndNoco(input: FabrikIndexInput): Promise<FabrikIndexResult> {
  const key = input.snapshot_key?.trim();
  const qdrantPointId = key ? fabrikDeterministicPointId(COLLECTION, key) : crypto.randomUUID();

  const prior = await qdrantRetrieveByIds(COLLECTION, [qdrantPointId]);
  const existingNocoId = payloadNocodbId(prior[0]?.payload as Record<string, unknown> | undefined);
  const reindexed = Boolean(existingNocoId);

  const blob = buildEmbedText(input);
  const { vector, model } = await embedText(blob);

  await logAuditTrail({
    actor: input.owner || 'fabrik-index',
    action: 'fabrik_embedding',
    resource_type: 'embedding',
    resource_id: qdrantPointId,
    result: 'ok',
    after_json: JSON.stringify({
      model,
      char_count: blob.length,
      collection: COLLECTION,
      phase: reindexed ? 'reindex' : 'new',
    }),
  });

  await qdrantEnsureCollection(COLLECTION, vector.length);

  const metaJson = JSON.stringify({
    qdrant_collection: COLLECTION,
    qdrant_point_id: qdrantPointId,
    embed_model: model,
    fabrik: true,
    snapshot_key: key ?? null,
    nocodb_extended: NOCO_EXTENDED,
  });

  const payload = {
    kind: 'fabrik_snapshot',
    title: input.title,
    owner: input.owner ?? '',
    description: input.description ?? '',
    notes: input.notes ?? '',
    snapshot_key: key ?? '',
    stations: FABRIK_STATIONS.map((s) => ({ id: s.id, title: s.title })),
    embed_model: model,
    indexed_at: new Date().toISOString(),
    nocodb_pending: true,
    nocodb_extended: NOCO_EXTENDED,
  };

  await qdrantUpsertPoint(COLLECTION, qdrantPointId, vector, payload);

  const rowPayload = buildNocoRowPayload(input, metaJson, qdrantPointId, model, COLLECTION, key);

  const row = existingNocoId ? await nocoPatchRow(existingNocoId, rowPayload) : await nocoPostRow(rowPayload);

  const nocoId = String(row.Id ?? row.id ?? '');

  await qdrantUpsertPoint(COLLECTION, qdrantPointId, vector, {
    ...payload,
    nocodb_pending: false,
    nocodb_id: nocoId,
    nocodb_table: NOCO_TABLE,
  });

  await logAuditTrail({
    actor: input.owner || 'fabrik-index',
    action: reindexed ? 'fabrik_reindex' : 'fabrik_index',
    resource_type: 'fabrik_snapshot',
    resource_id: qdrantPointId,
    result: 'ok',
    after_json: JSON.stringify({ nocoId, collection: COLLECTION, reindexed, nocodb_extended: NOCO_EXTENDED }),
  });

  return {
    qdrant_collection: COLLECTION,
    qdrant_point_id: qdrantPointId,
    embed_model: model,
    nocodb: row,
    reindexed,
    nocodb_extended: NOCO_EXTENDED,
  };
}
