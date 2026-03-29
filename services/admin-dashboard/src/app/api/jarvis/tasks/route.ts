export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const AIOS_CORE_BASE = process.env.AIOS_CORE_URL ?? 'http://aios-core:8000';
const AIOS_TOKEN = process.env.AIOS_TOKEN ?? '';

/** GET /api/jarvis/tasks?status=pending&limit=50 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? '';
  const limit  = searchParams.get('limit')  ?? '50';

  const params = new URLSearchParams({ limit });
  if (status) params.set('status', status);

  try {
    const res = await fetch(`${AIOS_CORE_BASE}/api/jarvis/tasks?${params}`, {
      cache: 'no-store',
      headers: {
        'x-aios-token': AIOS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `AIOS Core returned ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: `AIOS Core not reachable: ${err}` },
      { status: 502 }
    );
  }
}
