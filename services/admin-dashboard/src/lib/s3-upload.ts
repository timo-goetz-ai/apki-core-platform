/**
 * S3-kompatible Upload-Utility für Hetzner Object Storage
 * Verwendet AWS Signature V4 (ohne SDK)
 *
 * Benötigte Env-Vars (in Coolify):
 *   NC_S3_ACCESS_KEY      → Hetzner Object Storage Access Key
 *   NC_S3_ACCESS_SECRET   → Hetzner Object Storage Secret Key
 *   NC_S3_BUCKET_NAME     → Bucket-Name (Standard: noco-aios)
 *   NC_S3_REGION          → Region (Standard: fsn1)
 */

import { createHmac, createHash } from "crypto";

const S3_ENDPOINT = "fsn1.your-objectstorage.com";
const S3_BUCKET   = process.env.NC_S3_BUCKET_NAME    ?? "noco-aios";
const S3_KEY      = process.env.NC_S3_ACCESS_KEY      ?? "";
const S3_SECRET   = process.env.NC_S3_ACCESS_SECRET   ?? "";
const S3_REGION   = process.env.NC_S3_REGION          ?? "fsn1";

function sha256Hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}
function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}
function getSigningKey(dateStamp: string): Buffer {
  const kDate    = hmacSha256(`AWS4${S3_SECRET}`, dateStamp);
  const kRegion  = hmacSha256(kDate, S3_REGION);
  const kService = hmacSha256(kRegion, "s3");
  return hmacSha256(kService, "aws4_request");
}

export interface UploadResult {
  s3Url:    string;
  cdnUrl:   string | null;
  key:      string;
  sizeByte: number;
}

/**
 * Lädt einen Buffer in S3 hoch und gibt die öffentliche URL zurück.
 *
 * @param key        S3-Pfad, z.B. "assets/image-2026-03-26.png"
 * @param body       Dateiinhalt als Buffer / ArrayBuffer
 * @param mimeType   MIME-Type, z.B. "image/png" oder "audio/mpeg"
 */
export async function uploadToS3(
  key: string,
  body: Buffer | ArrayBuffer,
  mimeType: string
): Promise<UploadResult> {
  const buffer = body instanceof ArrayBuffer ? Buffer.from(body) : body;

  const now       = new Date();
  const amzDate   = now.toISOString().replace(/[:\-]|\.\d{3}/g, "").slice(0, 15) + "Z";
  const dateStamp = amzDate.slice(0, 8);
  const host      = `${S3_BUCKET}.${S3_ENDPOINT}`;
  const path      = `/${key}`;

  const payloadHash      = sha256Hex(buffer);
  const canonicalHeaders = `content-type:${mimeType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders    = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = `PUT\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const credentialScope = `${dateStamp}/${S3_REGION}/s3/aws4_request`;
  const stringToSign    = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256Hex(canonicalRequest)}`;
  const signature       = hmacSha256(getSigningKey(dateStamp), stringToSign).toString("hex");
  const authHeader      = `AWS4-HMAC-SHA256 Credential=${S3_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const res = await fetch(`https://${host}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type":          mimeType,
      "x-amz-date":            amzDate,
      "x-amz-content-sha256":  payloadHash,
      "x-amz-acl":             "public-read",
      Authorization:            authHeader,
    },
    body: buffer as unknown as BodyInit,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`S3 Upload fehlgeschlagen (${res.status}): ${errText.slice(0, 300)}`);
  }

  const s3Url = `https://${host}/${key}`;
  return {
    s3Url,
    cdnUrl:   null,
    key,
    sizeByte: buffer.byteLength,
  };
}

/**
 * Generiert einen S3-Key für ein Asset.
 * Format: assets/<type>/<YYYY-MM-DD>/<filename>
 */
export function buildAssetKey(
  type: "image" | "audio" | "video" | "text",
  filename: string
): string {
  const date = new Date().toISOString().split("T")[0];
  return `assets/${type}/${date}/${filename}`;
}
