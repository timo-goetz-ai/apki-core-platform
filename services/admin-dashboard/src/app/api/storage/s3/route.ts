export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createHmac, createHash } from 'crypto';

const S3_ENDPOINT = 'fsn1.your-objectstorage.com';
const S3_BUCKET   = process.env.NC_S3_BUCKET_NAME ?? 'noco-aios';
const S3_KEY      = process.env.NC_S3_ACCESS_KEY ?? '5BSXSKXZSS5XZSAVK7N9';
const S3_SECRET   = process.env.NC_S3_ACCESS_SECRET ?? 'wjKpLOPPMJjsM3i0EhCn83gZkQlITHd2B2A2iQAh';
const S3_REGION   = process.env.NC_S3_REGION ?? 'fsn1';

function sha256(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}
function hmacSha256(key: Buffer | string, data: string): Buffer {
  return createHmac('sha256', key).update(data, 'utf8').digest();
}
function getSigningKey(dateStamp: string): Buffer {
  const kDate    = hmacSha256(`AWS4${S3_SECRET}`, dateStamp);
  const kRegion  = hmacSha256(kDate, S3_REGION);
  const kService = hmacSha256(kRegion, 's3');
  return hmacSha256(kService, 'aws4_request');
}

export async function GET() {
  try {
    const now       = new Date();
    const amzDate   = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z';
    const dateStamp = amzDate.slice(0, 8);
    const host      = `${S3_BUCKET}.${S3_ENDPOINT}`;
    const path      = '/';
    const query     = 'list-type=2&max-keys=1000';

    const payloadHash = sha256('');
    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders   = 'host;x-amz-content-sha256;x-amz-date';
    const canonicalRequest = `GET\n${path}\n${query}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const credentialScope = `${dateStamp}/${S3_REGION}/s3/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${sha256(canonicalRequest)}`;
    const signature = hmacSha256(getSigningKey(dateStamp), stringToSign).toString('hex');
    const authHeader = `AWS4-HMAC-SHA256 Credential=${S3_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const resp = await fetch(`https://${host}${path}?${query}`, {
      headers: {
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        Authorization: authHeader,
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json({ error: `S3 ${resp.status}: ${txt.slice(0, 200)}`, bucket: S3_BUCKET, objects: [], totalSize: 0 });
    }

    const xml = await resp.text();

    // Parse object count and total size from XML
    const keyCountMatch = xml.match(/<KeyCount>(\d+)<\/KeyCount>/);
    const objects: Array<{ key: string; size: number; lastModified: string }> = [];
    const objectRegex = /<Contents>[\s\S]*?<Key>(.*?)<\/Key>[\s\S]*?<Size>(\d+)<\/Size>[\s\S]*?<LastModified>(.*?)<\/LastModified>[\s\S]*?<\/Contents>/g;
    let match;
    while ((match = objectRegex.exec(xml)) !== null) {
      objects.push({ key: match[1], size: parseInt(match[2]), lastModified: match[3] });
    }
    const totalSize = objects.reduce((sum, o) => sum + o.size, 0);
    const keyCount  = keyCountMatch ? parseInt(keyCountMatch[1]) : objects.length;

    // Group by prefix (top-level "folders")
    const folders: Record<string, { count: number; size: number }> = {};
    for (const obj of objects) {
      const prefix = obj.key.includes('/') ? obj.key.split('/')[0] : '_root_';
      if (!folders[prefix]) folders[prefix] = { count: 0, size: 0 };
      folders[prefix].count++;
      folders[prefix].size += obj.size;
    }

    return NextResponse.json({
      bucket: S3_BUCKET,
      region: S3_REGION,
      endpoint: S3_ENDPOINT,
      keyCount,
      totalSize,
      totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100,
      folders,
      recentObjects: objects.slice(-10).reverse(),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message, bucket: S3_BUCKET, objects: [], totalSize: 0 });
  }
}
