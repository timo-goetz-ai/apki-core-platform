import { NextResponse } from 'next/server';

const N8N_BASE = process.env.N8N_BASE_URL ?? 'https://n8n.automation-plus-ki.de';
const N8N_API_KEY = process.env.N8N_API_KEY ?? '';

// Fetches current workflow list from n8n and returns it
export async function POST() {
  try {
    const res = await fetch(`${N8N_BASE}/api/v1/workflows`, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`n8n responded ${res.status}`);
    const data = await res.json();
    return NextResponse.json({ ok: true, count: data.data?.length ?? 0, synced: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 502 });
  }
}
