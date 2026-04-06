export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const POSTIZ_URL     = (process.env.POSTIZ_INTERNAL_URL ?? 'http://10.0.1.20:3000').replace(/\/$/, '');
const POSTIZ_API_KEY = process.env.POSTIZ_API_KEY ?? '375d7c0ee7a93622f4ceeff3fa1a331b397fbaa7861caa3c2d543b9e92972219';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const startDate = searchParams.get('startDate') ?? new Date(Date.now() - 7 * 86400_000).toISOString();
  const endDate   = searchParams.get('endDate')   ?? new Date(Date.now() + 30 * 86400_000).toISOString();

  try {
    const res = await fetch(
      `${POSTIZ_URL}/public/v1/posts?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`,
      {
        headers: { Authorization: POSTIZ_API_KEY },
        signal: AbortSignal.timeout(8000),
      }
    );
    if (!res.ok) {
      return NextResponse.json({ posts: [], error: `Postiz ${res.status}` }, { status: 200 });
    }
    const data = await res.json();
    return NextResponse.json({ posts: data.posts ?? data.p ?? [] });
  } catch (e) {
    return NextResponse.json({ posts: [], error: String(e) }, { status: 200 });
  }
}
