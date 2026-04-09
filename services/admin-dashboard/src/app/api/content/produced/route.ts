export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY ?? '';

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
    // Fetch from Supabase content_pipeline table
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/content_pipeline?select=*&order=created_at.desc&limit=50`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!res.ok) {
      return NextResponse.json({ items: [], source: 'empty', error: 'Supabase nicht erreichbar' });
    }

    const rows = (await res.json()) as Record<string, unknown>[];
    const items: ContentItem[] = rows.map((row) => ({
      id: row.id as number,
      topic: (row.topic ?? row.title ?? '—') as string,
      category: (row.category ?? 'Allgemein') as string,
      status: (row.status ?? 'unknown') as string,
      stage: (row.stage ?? '—') as string,
      created_at: (row.created_at ?? '') as string,
      updated_at: (row.updated_at ?? '') as string,
      content_text: row.content_text as string | undefined,
      image_url: row.image_url as string | undefined,
      voice_url: row.voice_url as string | undefined,
      blog_id: row.blog_id as string | undefined,
      output_url: row.output_url as string | undefined,
      storage_type: row.storage_type as string | undefined,
    }));

    return NextResponse.json({ items, source: 'supabase' });
  } catch (err) {
    return NextResponse.json({ items: [], source: 'error', error: String(err) });
  }
}
