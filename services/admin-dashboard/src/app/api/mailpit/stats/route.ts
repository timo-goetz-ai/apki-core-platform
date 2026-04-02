import { NextResponse } from 'next/server';

const MAILPIT_URL = process.env.MAILPIT_URL ?? 'https://mail.automation-plus-ki.de';

export async function GET() {
  try {
    const res = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=1`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json({ total: 0, unread: 0 }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      total: data.total ?? data.messages_count ?? 0,
      unread: data.unread ?? 0,
    });
  } catch {
    return NextResponse.json({ total: 0, unread: 0 }, { status: 502 });
  }
}
