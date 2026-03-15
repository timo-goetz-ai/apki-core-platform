import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const CF_BASE = "https://api.cloudflare.com/client/v4";

export async function GET() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "CLOUDFLARE_API_TOKEN nicht gesetzt", zones: [] }, { status: 200 });
  }

  try {
    const res = await fetch(`${CF_BASE}/zones?per_page=50&status=active`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      next: { revalidate: 0 },
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.errors?.[0]?.message ?? "Cloudflare API Fehler");

    const zones = data.result.map((z: {
      id: string; name: string; status: string;
      plan: { name: string }; meta: { phishing_detected: boolean };
      modified_on: string;
    }) => ({
      id: z.id,
      name: z.name,
      status: z.status,
      plan: z.plan?.name ?? "Free",
      phishingDetected: z.meta?.phishing_detected ?? false,
      modifiedOn: z.modified_on,
    }));

    return NextResponse.json({ zones });
  } catch (e) {
    return NextResponse.json({ error: String(e), zones: [] }, { status: 503 });
  }
}
