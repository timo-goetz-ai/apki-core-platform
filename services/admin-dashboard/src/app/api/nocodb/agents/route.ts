import { NextResponse } from 'next/server';
import { getAgents } from '@/lib/nocodb';

export async function GET() {
  try {
    const agents = await getAgents();
    return NextResponse.json(agents);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fehler beim Laden der Agenten' },
      { status: 500 }
    );
  }
}
