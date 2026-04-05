export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'https://directus.automation-plus-ki.de';
const DIRECTUS_TOKEN = process.env.DIRECTUS_TOKEN ?? '';

interface ContentItem {
  id: number;
  topic: string;
  category: string;
  status: string;
  stage: string;
  created_at: string;
  updated_at: string;
  content_text?: string;
  image_url?: string;
  voice_url?: string;
  blog_id?: string;
  output_url?: string;
  storage_type?: string; // 'gdrive' | 's3' | 'local'
}

export async function GET() {
  try {
    // Fetch from Directus 400_content_pipeline collection
    const res = await fetch(
      `${DIRECTUS_URL}/items/400_content_pipeline?sort=-date_created&limit=50&fields=*`,
      {
        headers: {
          Authorization: `Bearer ${DIRECTUS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!res.ok) {
      // Fallback: try the NocoDB-style API wrapper
      const fallbackRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/api/content-factory/pipeline`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return NextResponse.json({ items: data.jobs ?? [], source: 'pipeline-api' });
      }
      return NextResponse.json({ items: [], source: 'empty', error: 'Directus nicht erreichbar' });
    }

    const data = await res.json();
    const items: ContentItem[] = (data.data ?? []).map((row: Record<string, unknown>) => ({
      id: row.id,
      topic: row.topic ?? row.Title ?? '—',
      category: row.category ?? row.Category ?? 'Allgemein',
      status: row.status ?? 'unknown',
      stage: row.stage ?? '—',
      created_at: row.date_created ?? row.created_at ?? '',
      updated_at: row.date_updated ?? row.updated_at ?? '',
      content_text: row.content_text as string | undefined,
      image_url: row.image_url as string | undefined,
      voice_url: row.voice_url as string | undefined,
      blog_id: row.blog_id as string | undefined,
      output_url: row.output_url as string | undefined,
      storage_type: row.storage_type as string | undefined,
    }));

    return NextResponse.json({ items, source: 'directus' });
  } catch (err) {
    return NextResponse.json({ items: [], source: 'error', error: String(err) });
  }
}
