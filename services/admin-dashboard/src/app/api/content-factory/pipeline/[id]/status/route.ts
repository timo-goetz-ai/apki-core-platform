import { NextRequest, NextResponse } from 'next/server';
import { getPipelineJob } from '@/lib/nocodb';

export const dynamic = 'force-dynamic';

// GET /api/content-factory/pipeline/[id]/status
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = Number(params.id);
  if (isNaN(jobId)) {
    return NextResponse.json({ error: 'Ungültige Job-ID' }, { status: 400 });
  }

  const job = await getPipelineJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job nicht gefunden' }, { status: 404 });
  }

  return NextResponse.json({ job });
}
