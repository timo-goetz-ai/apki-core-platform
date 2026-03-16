import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CF_BASE = "https://api.cloudflare.com/client/v4";

export async function GET() {
  const token = process.env.CLOUDFLARE_API_TOKEN ?? process.env.CLOUDFLARE_API_KEY;
  const email = process.env.CLOUDFLARE_EMAIL;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountId) {
    return NextResponse.json({
      error: "CLOUDFLARE_API_TOKEN oder CLOUDFLARE_ACCOUNT_ID fehlt",
      tunnels: [],
    }, { status: 200 });
  }

  const authHeaders: Record<string, string> = email
    ? { "X-Auth-Key": token, "X-Auth-Email": email, "Content-Type": "application/json" }
    : { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  try {
    const res = await fetch(
      `${CF_BASE}/accounts/${accountId}/cfd_tunnel?is_deleted=false&per_page=50`,
      {
        headers: authHeaders,
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8000),
      }
    );
    const data = await res.json();
    if (!data.success) throw new Error(data.errors?.[0]?.message ?? "Cloudflare API Fehler");

    const tunnels = data.result.map((t: {
      id: string; name: string; status: string;
      created_at: string; connections: unknown[];
    }) => ({
      id: t.id,
      name: t.name,
      status: t.status,
      createdAt: t.created_at,
      connections: (t.connections ?? []).length,
    }));

    return NextResponse.json({ tunnels });
  } catch (e) {
    return NextResponse.json({ error: String(e), tunnels: [] }, { status: 503 });
  }
}
