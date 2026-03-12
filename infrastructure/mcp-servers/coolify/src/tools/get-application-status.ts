import { CoolifyClient, CoolifyApiError } from "../coolify-client.js";

export const definition = {
  name: "get_application_status",
  description:
    "Get the current status of a Coolify application including container status, resource limits, and health check configuration.",
  inputSchema: {
    type: "object" as const,
    properties: {
      app_id: {
        type: "string",
        description: "The UUID of the application",
      },
    },
    required: ["app_id"],
  },
};

export async function handler(
  client: CoolifyClient,
  params: Record<string, unknown>,
) {
  const appId = params.app_id as string;
  if (!appId) {
    return {
      content: [
        { type: "text" as const, text: "Error: app_id is required" },
      ],
      isError: true,
    };
  }

  try {
    const app = await client.getApplication(appId);

    // Derive status info from the application details
    const statusInfo = {
      app_id: app.uuid,
      name: app.name,
      status: app.status ?? "unknown",
      fqdn: app.fqdn,
      ports_exposed: app.ports_exposes ?? null,
      resource_limits: {
        memory: app.limits_memory ?? null,
        memory_swap: app.limits_memory_swap ?? null,
        cpus: app.limits_cpus ?? null,
        cpu_shares: app.limits_cpu_shares ?? null,
      },
      health_check: {
        enabled: app.health_check_enabled ?? false,
        path: app.health_check_path ?? null,
        port: app.health_check_port ?? null,
        method: app.health_check_method ?? null,
        interval: app.health_check_interval ?? null,
        timeout: app.health_check_timeout ?? null,
        retries: app.health_check_retries ?? null,
        expected_status: app.health_check_return_code ?? null,
      },
      last_updated: app.updated_at,
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(statusInfo, null, 2),
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
