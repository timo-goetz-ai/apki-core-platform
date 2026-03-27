import { NextRequest, NextResponse } from 'next/server';
import { createPipelineJob, getPipelineJobs } from '@/lib/nocodb';

export const dynamic = 'force-dynamic';

// GET /api/content-factory/pipeline — alle Jobs
export async function GET() {
  const jobs = await getPipelineJobs();
  return NextResponse.json({ jobs });
}

// POST /api/content-factory/pipeline — neuen Job anlegen
export async function POST(req: NextRequest) {
  const { topic, category = 'Allgemein', tone, target_platforms, source_opportunity_id } = await req.json();

  if (!topic) {
    return NextResponse.json({ error: 'topic erforderlich' }, { status: 400 });
  }

  const job = await createPipelineJob({
    topic,
    category,
    tone,
    target_platforms,
    source_opportunity_id,
  });

  return NextResponse.json({ job });
}
