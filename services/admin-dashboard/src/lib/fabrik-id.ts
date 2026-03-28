import { createHash } from 'crypto';

/**
 * Stabile Qdrant-Point-ID aus logischem Schlüssel (Idempotenz bei Re-Index).
 * Format UUID-artig (32 Hex + Bindestriche), von Qdrant als String-ID akzeptiert.
 */
export function fabrikDeterministicPointId(collection: string, snapshotKey: string): string {
  const key = `${collection}\0${snapshotKey.trim().toLowerCase()}`;
  const h = createHash('sha256').update(key).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}
