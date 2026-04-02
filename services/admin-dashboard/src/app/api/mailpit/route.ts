import { NextResponse } from 'next/server';

const MAILPIT_URL = process.env.MAILPIT_URL ?? 'https://mail.automation-plus-ki.de';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    const res = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=${limit}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Mailpit responded ${res.status}`, messages: [], total: 0 }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      messages: data.messages ?? [],
      total: data.total ?? data.messages_count ?? 0,
    });
  } catch (e) {
    return NextResponse.json({
      error: e instanceof Error ? e.message : 'Mailpit nicht erreichbar',
      messages: [],
      total: 0,
    }, { status: 502 });
  }
}
