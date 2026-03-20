export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const BASE    = process.env.NOCODB_URL ?? 'https://nocodb.automation-plus-ki.de';
const TOKEN   = process.env.NOCODB_API_TOKEN ?? '';
const PROJECT = process.env.NOCODB_AI_SYSTEM_BASE_ID ?? 'pfx0ca6docorj8n';

/**
 * Returns { templates: [], brandItems: [] } — fetches both tables server-side.
 * Discovers table IDs by querying the project meta first.
 */
export async function GET() {
  const headers = { 'xc-token': TOKEN };

  // 1. Discover table IDs
  const metaRes = await fetch(
    `${BASE}/api/v1/db/meta/projects/${PROJECT}/tables`,
    { headers, signal: AbortSignal.timeout(10000) }
  );
  if (!metaRes.ok) {
    return NextResponse.json({ error: `Meta fetch failed: ${metaRes.status}` }, { status: 502 });
  }
  const meta = await metaRes.json();
  const tables: { id: string; title: string }[] = meta.list ?? [];

  const tplTable   = tables.find(t => t.title.toLowerCase().includes('template'));
  const brandTable = tables.find(t => t.title.toLowerCase().includes('brand_identity'));

  // 2. Fetch data in parallel
  const [templatesRes, brandRes] = await Promise.all([
    tplTable
      ? fetch(`${BASE}/api/v1/db/data/noco/${PROJECT}/${tplTable.id}?limit=100`, { headers })
      : Promise.resolve(null),
    brandTable
      ? fetch(`${BASE}/api/v1/db/data/noco/${PROJECT}/${brandTable.id}?limit=100`, { headers })
      : Promise.resolve(null),
  ]);

  const templates  = templatesRes?.ok  ? ((await templatesRes.json()).list  ?? []) : [];
  const brandItems = brandRes?.ok      ? ((await brandRes.json()).list      ?? []) : [];

  return NextResponse.json({ templates, brandItems });
}
