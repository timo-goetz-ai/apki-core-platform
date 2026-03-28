/**
 * Qdrant REST: Collection anlegen, Punkte upserten, abfragen, Ähnlichkeitssuche.
 */

const QDRANT_URL = (process.env.QDRANT_URL ?? 'https://qdrant.automation-plus-ki.de').replace(/\/$/, '');
const QDRANT_KEY = process.env.QDRANT_API_KEY ?? '';

function qdrantHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (QDRANT_KEY) h['api-key'] = QDRANT_KEY;
  return h;
}

export type QdrantScoredPoint = {
  id: string | number;
  score?: number;
  payload?: Record<string, unknown>;
};

export async function qdrantEnsureCollection(collection: string, vectorSize: number): Promise<void> {
  const info = await fetch(`${QDRANT_URL}/collections/${encodeURIComponent(collection)}`, {
    headers: qdrantHeaders(),
    signal: AbortSignal.timeout(15000),
  });
  if (info.ok) return;

  const put = await fetch(`${QDRANT_URL}/collections/${encodeURIComponent(collection)}`, {
    method: 'PUT',
    headers: qdrantHeaders(),
    body: JSON.stringify({
      vectors: { size: vectorSize, distance: 'Cosine' },
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!put.ok) {
    const t = await put.text();
    throw new Error(`Qdrant collection ${put.status}: ${t.slice(0, 400)}`);
  }
}

export async function qdrantUpsertPoint(
  collection: string,
  pointId: string,
  vector: number[],
  payload: Record<string, unknown>
): Promise<void> {
  const res = await fetch(`${QDRANT_URL}/collections/${encodeURIComponent(collection)}/points?wait=true`, {
    method: 'PUT',
    headers: qdrantHeaders(),
    body: JSON.stringify({
      points: [{ id: pointId, vector, payload }],
    }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Qdrant upsert ${res.status}: ${t.slice(0, 400)}`);
  }
}

/** Points anhand IDs laden (Payload), z. B. für Idempotenz vor NocoDB-Entscheidung. */
export async function qdrantRetrieveByIds(
  collection: string,
  ids: string[]
): Promise<QdrantScoredPoint[]> {
  if (!ids.length) return [];
  const res = await fetch(`${QDRANT_URL}/collections/${encodeURIComponent(collection)}/points/scroll`, {
    method: 'POST',
    headers: qdrantHeaders(),
    body: JSON.stringify({
      filter: { must: [{ has_id: ids }] },
      limit: ids.length,
      with_payload: true,
      with_vector: false,
    }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Qdrant scroll ${res.status}: ${t.slice(0, 400)}`);
  }
  const data = (await res.json()) as { result?: { points?: Array<{ id: string | number; payload?: Record<string, unknown> }> } };
  const pts = data.result?.points ?? [];
  return pts.map((p) => ({ id: p.id, payload: p.payload }));
}

/** Kosinus-Ähnlichkeit; optional Filter (z. B. kind = fabrik_snapshot). */
export async function qdrantSearchSimilar(
  collection: string,
  vector: number[],
  limit: number,
  filter?: Record<string, unknown>
): Promise<QdrantScoredPoint[]> {
  const body: Record<string, unknown> = {
    vector,
    limit,
    with_payload: true,
    with_vector: false,
  };
  if (filter) body.filter = filter;

  const res = await fetch(`${QDRANT_URL}/collections/${encodeURIComponent(collection)}/points/search`, {
    method: 'POST',
    headers: qdrantHeaders(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Qdrant search ${res.status}: ${t.slice(0, 400)}`);
  }
  const data = (await res.json()) as {
    result?: Array<{ id: string | number; score?: number; payload?: Record<string, unknown> }>;
  };
  const hits = data.result ?? [];
  return hits.map((h) => ({ id: h.id, score: h.score, payload: h.payload }));
}

/** Punkte anhand ID löschen (Drift-Bereinigung, Webhook). */
export async function qdrantDeletePoints(collection: string, pointIds: (string | number)[]): Promise<void> {
  if (!pointIds.length) return;
  const res = await fetch(`${QDRANT_URL}/collections/${encodeURIComponent(collection)}/points/delete?wait=true`, {
    method: 'POST',
    headers: qdrantHeaders(),
    body: JSON.stringify({ points: pointIds }),
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Qdrant delete ${res.status}: ${t.slice(0, 400)}`);
  }
}
