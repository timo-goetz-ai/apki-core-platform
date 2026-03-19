export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createProject } from '@/lib/nocodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await createProject(body);
    return NextResponse.json(record, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fehler beim Erstellen des Projekts' },
      { status: 500 }
    );
  }
}
