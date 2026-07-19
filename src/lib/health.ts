export type HealthStatus = {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  checks: Record<string, boolean>;
};

export function buildHealthStatus(
  service: string,
  checks: Record<string, boolean>,
): HealthStatus {
  const allOk = Object.values(checks).every(Boolean);
  const anyOk = Object.values(checks).some(Boolean);

  let status: HealthStatus['status'] = 'error';
  if (allOk) status = 'ok';
  else if (anyOk) status = 'degraded';

  return { status, service, checks };
}

export function parseDatabaseUrl(url: string): { valid: boolean; host?: string } {
  try {
    const parsed = new URL(url.replace(/^postgresql(\+\w+)?:/, 'postgres:'));
    return { valid: Boolean(parsed.hostname), host: parsed.hostname };
  } catch {
    return { valid: false };
  }
}
