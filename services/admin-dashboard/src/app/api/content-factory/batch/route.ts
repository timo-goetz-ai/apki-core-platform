import { NextRequest, NextResponse } from 'next/server';
import { createBatchJob, getBatchJobs } from '@/lib/nocodb';

const N8N_BASE = process.env.N8N_URL ?? 'http://10.0.1.16:5678';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      topics: string[];
      category: string;
      steps?: string[];
      scheduled_at?: string;
    };

    const { topics, category, steps = ['blog', 'image', 'voice'], scheduled_at } = body;

    if (!topics?.length) {
      return NextResponse.json({ error: 'topics darf nicht leer sein' }, { status: 400 });
    }
    if (topics.length > 20) {
      return NextResponse.json({ error: 'Maximal 20 Topics pro Batch' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: 'category fehlt' }, { status: 400 });
    }

    // Batch Job in NocoDB anlegen
    const batchJob = await createBatchJob(
      topics.map((t) => t.trim()).filter(Boolean),
      category,
      steps,
      scheduled_at
    );

    // n8n Batch Trigger Webhook aufrufen (fire-and-forget)
    fetch(`${N8N_BASE}/webhook/batch-trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_id: batchJob.batch_id }),
    }).catch((e) => console.warn('[Batch] n8n trigger Fehler:', e));

    return NextResponse.json({ ok: true, batch_id: batchJob.batch_id, batch: batchJob });
  } catch (e) {
    console.error('[Batch] POST Fehler:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unbekannter Fehler' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const jobs = await getBatchJobs(50);
    return NextResponse.json({ jobs });
  } catch (e) {
    console.error('[Batch] GET Fehler:', e);
    return NextResponse.json({ jobs: [], error: String(e) }, { status: 500 });
  }
}
