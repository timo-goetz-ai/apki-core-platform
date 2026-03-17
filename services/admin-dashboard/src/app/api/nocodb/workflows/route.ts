import { NextResponse } from 'next/server';
import { getWorkflowIndex } from '@/lib/nocodb';

export async function GET() {
  try {
    const workflows = await getWorkflowIndex();
    return NextResponse.json(workflows);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fehler beim Laden der Workflows' },
      { status: 500 }
    );
  }
}
