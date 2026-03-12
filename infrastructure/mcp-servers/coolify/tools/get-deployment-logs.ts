import { CoolifyClient, CoolifyApiError } from "../coolify-client.js";

export const definition = {
  name: "get_deployment_logs",
  description:
    "Get deployment logs for an application. Returns the latest deployment history and logs.",
  inputSchema: {
    type: "object" as const,
    properties: {
      app_id: {
        type: "string",
        description: "The UUID of the application",
      },
      lines: {
        type: "number",
        description: "Number of log lines to return (default: 100)",
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

  const lines = (params.lines as number) ?? 100;

  try {
    // Fetch recent deployments for this app
    const deployments = await client.listDeployments(appId);

    const recentDeployments = deployments.slice(0, 5).map((d) => ({
      deployment_uuid: d.deployment_uuid ?? d.uuid,
      status: d.status,
      commit: d.commit,
      created_at: d.created_at,
      has_logs: !!d.logs,
    }));

    // Get logs from the latest deployment if available
    let latestLogs: string | null = null;
    if (deployments.length > 0) {
      const latest = deployments[0];
      if (latest.logs) {
        const logLines = latest.logs.split("\n");
        latestLogs = logLines.slice(-lines).join("\n");
      } else {
        // Try to fetch full deployment details for logs
        try {
          const detail = await client.getDeployment(
            latest.deployment_uuid ?? latest.uuid,
          );
          if (detail.logs) {
            const logLines = detail.logs.split("\n");
            latestLogs = logLines.slice(-lines).join("\n");
          }
        } catch {
          // Deployment detail might not be accessible
        }
      }
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              app_id: appId,
              total_deployments: deployments.length,
              recent_deployments: recentDeployments,
              latest_logs: latestLogs ?? "No logs available",
              lines_requested: lines,
            },
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
