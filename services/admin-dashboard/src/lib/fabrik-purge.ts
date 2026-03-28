import { qdrantDeletePoints } from '@/lib/qdrant-rest';
import { fabrikDeterministicPointId } from '@/lib/fabrik-id';
import { logAuditTrail } from '@/lib/nocodb';

const COLLECTION = process.env.QDRANT_FABRIK_COLLECTION ?? 'aios_fabrik';

export interface FabrikPurgeInput {
  qdrant_point_id?: string;
  snapshot_key?: string;
  /** für Audit */
  actor?: string;
}

export interface FabrikPurgeResult {
  qdrant_collection: string;
  qdrant_point_id: string;
}

/**
 * Entfernt einen Punkt aus Qdrant (z. B. nach Löschen der NocoDB-Zeile oder Drift-Cleanup).
 */
export async function purgeFabrikFromQdrant(input: FabrikPurgeInput): Promise<FabrikPurgeResult> {
  const key = input.snapshot_key?.trim();
  const id =
    input.qdrant_point_id?.trim() ||
    (key ? fabrikDeterministicPointId(COLLECTION, key) : '');
  if (!id) {
    throw new Error('qdrant_point_id oder snapshot_key ist Pflicht');
  }
  await qdrantDeletePoints(COLLECTION, [id]);
  await logAuditTrail({
    actor: input.actor ?? 'fabrik-purge',
    action: 'fabrik_purge_qdrant',
    resource_type: 'fabrik_snapshot',
    resource_id: id,
    result: 'ok',
    after_json: JSON.stringify({ collection: COLLECTION }),
  });
  return { qdrant_collection: COLLECTION, qdrant_point_id: id };
}
