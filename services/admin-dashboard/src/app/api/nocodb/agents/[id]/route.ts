export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { updateAgent, type NocoAgentPatch } from '@/lib/nocodb';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = (await req.json()) as NocoAgentPatch;
    await updateAgent(params.id, body);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fehler beim Aktualisieren des Agenten' },
      { status: 500 }
    );
  }
}
