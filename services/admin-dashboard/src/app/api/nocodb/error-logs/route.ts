export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getErrorLogs, createErrorLog, resolveErrorLog } from '@/lib/nocodb';

export async function GET() {
  try {
    const data = await getErrorLogs();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await createErrorLog(body);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: string | number };
    await resolveErrorLog(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}
