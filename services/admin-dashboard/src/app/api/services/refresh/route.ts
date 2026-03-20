import { NextResponse } from 'next/server';

// Triggers a fresh service health check — clients should refetch /api/services after this
export async function POST() {
  return NextResponse.json({ ok: true, refreshed: new Date().toISOString() });
}
