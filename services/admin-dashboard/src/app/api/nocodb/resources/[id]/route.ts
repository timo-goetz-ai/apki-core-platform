export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { updateResourceStatus, type ResourceStatus } from '@/lib/nocodb';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json() as { status: ResourceStatus };
    await updateResourceStatus(params.id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 });
  }
}
