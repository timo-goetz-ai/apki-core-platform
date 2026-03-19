export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getResources, createResource } from '@/lib/nocodb';

export async function GET() {
  try {
    const data = await getResources();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await createResource({
      ...body,
      discovered_at: body.discovered_at ?? new Date().toISOString(),
      status: body.status ?? 'discovered',
    });
    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}
