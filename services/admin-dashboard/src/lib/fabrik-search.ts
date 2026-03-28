import { embedText } from '@/lib/embeddings';
import { qdrantEnsureCollection, qdrantSearchSimilar, type QdrantScoredPoint } from '@/lib/qdrant-rest';

const COLLECTION = process.env.QDRANT_FABRIK_COLLECTION ?? 'aios_fabrik';

const FABRIK_KIND_FILTER = {
  must: [{ key: 'kind', match: { value: 'fabrik_snapshot' } }],
};

export type FabrikSearchHit = {
  id: string | number;
  score?: number;
  title?: string;
  owner?: string;
  nocodb_id?: string;
  indexed_at?: string;
};

export async function searchFabrikSnapshots(query: string, limit = 8): Promise<FabrikSearchHit[]> {
  const q = query.trim();
  if (!q) return [];

  const { vector } = await embedText(q);
  await qdrantEnsureCollection(COLLECTION, vector.length);

  const hits: QdrantScoredPoint[] = await qdrantSearchSimilar(
    COLLECTION,
    vector,
    Math.min(Math.max(limit, 1), 24),
    FABRIK_KIND_FILTER
  );

  return hits.map((h) => {
    const p = h.payload ?? {};
    return {
      id: h.id,
      score: h.score,
      title: typeof p.title === 'string' ? p.title : undefined,
      owner: typeof p.owner === 'string' ? p.owner : undefined,
      nocodb_id: typeof p.nocodb_id === 'string' ? p.nocodb_id : undefined,
      indexed_at: typeof p.indexed_at === 'string' ? p.indexed_at : undefined,
    };
  });
}

export function fabrikSearchCollection(): string {
  return COLLECTION;
}
