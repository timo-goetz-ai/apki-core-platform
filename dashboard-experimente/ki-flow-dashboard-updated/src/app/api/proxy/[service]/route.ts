// src/app/api/proxy/[service]/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Server-side proxy for all service health checks.
// API keys / tokens NEVER reach the browser.
// Secrets are injected via Coolify environment variables (sourced from 1Password).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { SERVICE_MAP } from "@/lib/services.config";

// Service-specific auth headers injected server-side from Coolify env vars
function getAuthHeaders(proxyKey: string): Record<string, string> {
  const headers: Record<string, string> = {};
  switch (proxyKey) {
    case "n8n":
      if (process.env.N8N_API_KEY)
        headers["X-N8N-API-KEY"] = process.env.N8N_API_KEY;
      break;
    case "grafana":
      if (process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN)
        headers["Authorization"] =
          `Bearer ${process.env.GRAFANA_SERVICE_ACCOUNT_TOKEN}`;
      break;
    case "nocodb":
      if (process.env.NOCODB_API_TOKEN)
        headers["xc-token"] = process.env.NOCODB_API_TOKEN;
      break;
    case "homeassistant":
      if (process.env.HA_LONG_LIVED_TOKEN)
        headers["Authorization"] =
          `Bearer ${process.env.HA_LONG_LIVED_TOKEN}`;
      break;
    case "prometheus":
      if (process.env.PROMETHEUS_BASIC_AUTH)
        headers["Authorization"] =
          `Basic ${Buffer.from(process.env.PROMETHEUS_BASIC_AUTH).toString("base64")}`;
      break;
    // hetzner-storage: S3 endpoint returns 403 without signed request → no auth header needed
    // authentik, mcp-hub: no token required for health endpoints
  }
  return headers;
}

// Hetzner Object Storage returns 403 on unauthenticated root — still means reachable
function isReachableStatus(proxyKey: string, httpStatus: number): boolean {
  if (proxyKey === "hetzner-storage" && httpStatus === 403) return true;
  return httpStatus >= 200 && httpStatus < 300;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { service: string } }
) {
  const { service } = params;
  const config = SERVICE_MAP[service];

  if (!config) {
    return NextResponse.json({ error: "Unknown service" }, { status: 404 });
  }

  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(config.healthEndpoint, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(service),
      },
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - start;

    if (!isReachableStatus(service, res.status)) {
      return NextResponse.json({
        status: "offline",
        latencyMs,
        checkedAt: new Date().toISOString(),
        error: `HTTP ${res.status}`,
      });
    }

    // For JSON health checks, validate the expected field
    if (config.healthType === "json" && config.healthJsonPath) {
      try {
        const body = await res.json();
        const value = getNestedValue(body, config.healthJsonPath);
        const isHealthy =
          !config.healthJsonExpect ||
          String(value) === config.healthJsonExpect ||
          value === true;

        return NextResponse.json({
          status: isHealthy ? "online" : "degraded",
          latencyMs,
          checkedAt: new Date().toISOString(),
          raw: body,
        });
      } catch {
        return NextResponse.json({
          status: "degraded",
          latencyMs,
          checkedAt: new Date().toISOString(),
          error: "JSON parse failed",
        });
      }
    }

    return NextResponse.json({
      status: "online",
      latencyMs,
      checkedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const message = err instanceof Error ? err.message : "Unknown error";
    const isTimeout = message.includes("aborted");

    return NextResponse.json({
      status: "offline",
      latencyMs: isTimeout ? null : latencyMs,
      checkedAt: new Date().toISOString(),
      error: isTimeout ? "Timeout (8s)" : message,
    });
  }
}

// Safely traverse dot-notation path in an object
function getNestedValue(obj: unknown, path: string): unknown {
  return path.split(".").reduce((acc: unknown, key: string) => {
    if (acc && typeof acc === "object" && key in (acc as object)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}
