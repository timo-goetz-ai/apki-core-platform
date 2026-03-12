import { CoolifyClient, CoolifyApiError } from "../coolify-client.js";

export const definition = {
  name: "get_application_details",
  description:
    "Get full details of a specific Coolify application including status, ports, URL, environment, build configuration, and health check settings.",
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
    // Try as application first, fall back to service
    let details: Record<string, unknown>;
    try {
      const app = await client.getApplication(appId);
      details = {
        app_id: app.uuid,
        name: app.name,
        type: "application",
        description: app.description,
        status: app.status ?? "unknown",
        fqdn: app.fqdn,
        repository: app.git_repository,
        branch: app.git_branch,
        commit: app.git_commit_sha ?? null,
        build_pack: app.build_pack,
        ports_exposed: app.ports_exposes,
        build_command: app.build_command ?? null,
        start_command: app.start_command ?? null,
        install_command: app.install_command ?? null,
        base_directory: app.base_directory ?? null,
        publish_directory: app.publish_directory ?? null,
        dockerfile: app.dockerfile ?? null,
        environment: app.environment?.name ?? null,
        project: app.environment?.project?.name ?? null,
        health_check: {
          enabled: app.health_check_enabled ?? false,
          path: app.health_check_path ?? null,
          port: app.health_check_port ?? null,
        },
        limits: {
          memory: app.limits_memory ?? null,
          cpus: app.limits_cpus ?? null,
        },
        created_at: app.created_at,
        updated_at: app.updated_at,
      };
    } catch {
      // Not an application – try as service
      const svc = (await client.getService(appId)) as Record<string, unknown>;
      details = {
        app_id: svc.uuid,
        name: svc.name,
        type: "service",
        description: svc.description ?? null,
        status: svc.status ?? "unknown",
        fqdn: svc.fqdn ?? null,
        environment: ((svc.environment as Record<string, unknown>)?.name as string) ?? null,
        project: (((svc.environment as Record<string, unknown>)?.project as Record<string, unknown>)?.name as string) ?? null,
        docker_compose: svc.docker_compose ?? null,
        created_at: svc.created_at,
        updated_at: svc.updated_at,
      };
    }

    return {
      content: [
        { type: "text" as const, text: JSON.stringify(details, null, 2) },
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
