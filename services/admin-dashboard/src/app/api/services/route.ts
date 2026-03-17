export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";

const HEALTH_CHECKS = [
  // Interne Docker-Hostnamen für Services auf demselben Server (kein Cloudflare-Loop)
  { id: "nexus-core",     url: "http://aios-nexus-core:8000/health" },
  { id: "infra",          url: "http://046279494c60465d88e337efb54d5504-211054072190:3000/api/health" },
  { id: "voice",          url: "http://voice-api-ckgw404o88ow0ccs00cow8k8:8000/health" },
  // Homestack-Services via öffentliche URL (eigenes Netzwerk)
  { id: "n8n",            url: "https://n8n.automation-plus-ki.de/healthz" },
  { id: "grafana",        url: "https://grafana.automation-plus-ki.de/api/health" },
  { id: "prometheus",     url: "https://prometheus.automation-plus-ki.de/-/healthy" },
  { id: "authentik",      url: "https://auth.automation-plus-ki.de/-/health/ready/" },
  { id: "nocodb",         url: "https://nocodb.automation-plus-ki.de/api/v1/health" },
  { id: "appflowy",       url: "https://appflowy.automation-plus-ki.de" },
  { id: "mailpit",        url: "https://mail.automation-plus-ki.de" },
  { id: "agents",         url: "https://agents.automation-plus-ki.de" },
  { id: "qdrant",         url: "https://qdrant.automation-plus-ki.de/healthz" },
  { id: "homepage",       url: "https://dashboard.automation-plus-ki.de" },
  { id: "mcp-grafana",    url: "https://mcp-grafana.automation-plus-ki.de/health" },
  { id: "mcp-nocodb",     url: "https://mcp-nocodb.automation-plus-ki.de/health" },
  { id: "mcp-postgres",   url: "https://mcp-postgres.automation-plus-ki.de/health" },
  { id: "mcp-prometheus", url: "https://mcp-prometheus.automation-plus-ki.de/health" },
  { id: "mcp-qdrant",     url: "https://mcp-qdrant.automation-plus-ki.de/health" },
  { id: "mcp-filesystem", url: "https://mcp-filesystem.automation-plus-ki.de/health" },
  { id: "mcp-authentik",  url: "https://mcp-authentik.automation-plus-ki.de/health" },
  { id: "mcp-n8n",        url: "https://mcp-n8n.automation-plus-ki.de/health" },
  { id: "mcp-github",     url: "https://mcp-github.automation-plus-ki.de/health" },
  { id: "mcp-cloudflare", url: "https://mcp-cloudflare.automation-plus-ki.de/health" },
  { id: "mcp-google",     url: "https://mcp-google.automation-plus-ki.de/health" },
  { id: "mcp-hetzner",    url: "https://mcp-hetzner.automation-plus-ki.de/health" },
  { id: "mcp-coolify",    url: "https://mcp-coolify.automation-plus-ki.de/health" },
];

async function checkHealth(id: string, url: string): Promise<{ id: string; status: "online" | "degraded" | "offline"; latency?: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  const t0 = Date.now();
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { "User-Agent": "aios-healthcheck/1.0" },
    });
    clearTimeout(timer);
    const latency = Date.now() - t0;
    return { id, status: res.ok ? "online" : "degraded", latency };
  } catch {
    clearTimeout(timer);
    return { id, status: "offline" };
  }
}

export async function GET() {
  const results = await Promise.allSettled(
    HEALTH_CHECKS.map((s) => checkHealth(s.id, s.url))
  );

  const statuses: Record<string, { status: string; latency?: number }> = {};
  results.forEach((r) => {
    if (r.status === "fulfilled") {
      statuses[r.value.id] = { status: r.value.status, latency: r.value.latency };
    }
  });

  return NextResponse.json(statuses, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
