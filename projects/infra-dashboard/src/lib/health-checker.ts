import type { ServiceConfig, ServiceStatus } from "./types";

const SLOW_THRESHOLD_MS = 2000;
const TIMEOUT_MS = 5000;

function buildResult(
  id: string,
  statusCode: number,
  responseTime: number
): ServiceStatus {
  const isUp = statusCode >= 200 && statusCode < 400;
  return {
    id,
    status: !isUp ? "offline" : responseTime > SLOW_THRESHOLD_MS ? "slow" : "online",
    responseTime,
    lastChecked: new Date().toISOString(),
    statusCode,
  };
}

export async function checkService(
  service: ServiceConfig
): Promise<ServiceStatus> {
  const start = Date.now();

  // Use GET directly - more reliable across different services
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(service.healthEndpoint, {
      method: "GET",
      headers: service.headers,
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);
    // Consume body to avoid memory leaks
    await response.text().catch(() => {});

    return buildResult(service.id, response.status, Date.now() - start);
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
