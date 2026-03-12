import { CoolifyClient, CoolifyApiError } from "../coolify-client.js";

export const definition = {
  name: "list_applications",
  description:
    "List all applications managed by Coolify. Returns app ID, name, status, environment info, and repository for each application.",
  inputSchema: {
    type: "object" as const,
    properties: {},
  },
};

export async function handler(
  client: CoolifyClient,
  _params: Record<string, unknown>,
) {
  try {
    // Fetch both applications and services in parallel
    const [apps, services] = await Promise.all([
      client.listApplications().catch(() => []),
      client.listServices().catch(() => []),
    ]);

    const appSummary = apps.map((app) => ({
      app_id: app.uuid,
      name: app.name,
      type: "application" as const,
      status: app.status ?? "unknown",
      fqdn: app.fqdn,
      repository: app.git_repository ?? null,
      branch: app.git_branch ?? null,
      build_pack: app.build_pack ?? null,
      environment: app.environment?.name ?? null,
      project: app.environment?.project?.name ?? null,
      created_at: app.created_at,
    }));

    const serviceSummary = (services as Record<string, unknown>[]).map((svc) => ({
      app_id: (svc.uuid as string) ?? null,
      name: (svc.name as string) ?? "unknown",
      type: "service" as const,
      status: (svc.status as string) ?? "unknown",
      fqdn: (svc.fqdn as string) ?? null,
      repository: null,
      branch: null,
      build_pack: null,
      environment: ((svc.environment as Record<string, unknown>)?.name as string) ?? null,
      project: (((svc.environment as Record<string, unknown>)?.project as Record<string, unknown>)?.name as string) ?? null,
      created_at: (svc.created_at as string) ?? null,
    }));

    const all = [...appSummary, ...serviceSummary];

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            { total: all.length, applications: appSummary, services: serviceSummary },
            null,
            2,
          ),
        },
      ],
    };
  } catch (error) {
    if (error instanceof CoolifyApiError) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error.message}` }],
        isError: true,
      };
    }
    throw error;
  }
}
