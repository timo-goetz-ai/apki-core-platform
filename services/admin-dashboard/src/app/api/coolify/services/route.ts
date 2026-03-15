import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.COOLIFY_URL;
  const apiKey  = process.env.COOLIFY_API_KEY;
  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "COOLIFY_URL oder COOLIFY_API_KEY fehlt", services: [] }, { status: 200 });
  }

  try {
    const [appsRes, servicesRes] = await Promise.all([
      fetch(`${baseUrl}/api/v1/applications`, {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8000),
      }),
      fetch(`${baseUrl}/api/v1/services`, {
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        next: { revalidate: 0 },
        signal: AbortSignal.timeout(8000),
      }),
    ]);

    const apps     = appsRes.ok     ? await appsRes.json()     : [];
    const services = servicesRes.ok ? await servicesRes.json() : [];

    type CoolifyItem = {
      uuid?: string; id?: string; name?: string;
      status?: string; fqdn?: string; git_repository?: string;
      updated_at?: string;
    };
    const normalize = (items: unknown[], kind: string) =>
      (Array.isArray(items) ? (items as CoolifyItem[]) : []).map((item) => ({
        id:       item.uuid ?? item.id ?? "–",
        name:     item.name ?? "Unbenannt",
        kind,
        status:   item.status ?? "unknown",
        fqdn:     item.fqdn ?? null,
        repo:     item.git_repository ?? null,
        updatedAt: item.updated_at ?? null,
      }));

    return NextResponse.json({
      services: [...normalize(apps, "app"), ...normalize(services, "service")],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), services: [] }, { status: 503 });
  }
}
