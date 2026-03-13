// Secrets (API keys, tokens) werden in 1Password verwaltet und als Coolify env vars gesetzt.
import type { ServiceConfig, ServiceStatus } from "./types";

const SLOW_THRESHOLD_MS = 2000;
const TIMEOUT_MS = 5000;

// Authentik login redirect = service IS running, just SSO-protected
const AUTHENTIK_INDICATORS = [
  "auth.automation-plus-ki.de",
  "/flows/",
  "authentik",
];

// Hetzner S3 returns 403 without a signed request — service IS running, treat as online.
// healthType "http" = any response (including 4xx) counts as reachable.
function isReachableStatus(statusCode: number, healthType?: string): boolean {
  if (healthType === "http") {
    return statusCode >= 200 && statusCode < 500;
  }
  return statusCode >= 200 && statusCode < 400;
}

function isAuthentikRedirect(response: Response): boolean {
  const location = response.headers.get("location") ?? "";
  return AUTHENTIK_INDICATORS.some((s) => location.includes(s));
}

function buildResult(
  id: string,
  statusCode: number,
  responseTime: number,
  protected_ = false,
  healthType?: string
): ServiceStatus {
  const isUp = isReachableStatus(statusCode, healthType);
  return {
    id,
    status: !isUp
      ? "offline"
      : responseTime > SLOW_THRESHOLD_MS
        ? "slow"
        : "online",
    responseTime,
    lastChecked: new Date().toISOString(),
    statusCode,
    protected: protected_,
  };
}

export async function checkService(
  service: ServiceConfig
): Promise<ServiceStatus> {
  const start = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(service.healthEndpoint, {
      method: "GET",
      headers: service.headers,
      signal: controller.signal,
      redirect: "manual", // Don't follow – detect Authentik redirects ourselves
    });

    clearTimeout(timeout);
    await response.text().catch(() => {});

    const elapsed = Date.now() - start;

    // 302 to Authentik = service is alive, just protected
    if (response.status === 302 && isAuthentikRedirect(response)) {
      return buildResult(service.id, 200, elapsed, true);
    }

    // 3xx in general = service responded, treat as up
    if (response.status >= 301 && response.status < 400) {
      return buildResult(service.id, 200, elapsed, false);
    }

    return buildResult(service.id, response.status, elapsed, false, service.healthType);
  } catch {
    return {
      id: service.id,
      status: "offline",
      responseTime: Date.now() - start,
      lastChecked: new Date().toISOString(),
    };
  }
}

export async function checkAllServices(
  services: ServiceConfig[]
): Promise<ServiceStatus[]> {
  const results = await Promise.allSettled(services.map(checkService));
  return results.map((result, i) =>
    result.status === "fulfilled"
      ? result.value
      : {
          id: services[i].id,
          status: "offline" as const,
          responseTime: 0,
          lastChecked: new Date().toISOString(),
        }
  );
}
