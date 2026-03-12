import { CoolifyClient, CoolifyApiError } from "../coolify-client.js";

export const definition = {
  name: "deploy_application",
  description:
    "Trigger a manual deployment for a Coolify application. Optionally force a rebuild.",
  inputSchema: {
    type: "object" as const,
    properties: {
      app_id: {
        type: "string",
        description: "The UUID of the application to deploy",
      },
      force: {
        type: "boolean",
        description: "Force a rebuild even if no changes detected (default: false)",
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

  const force = (params.force as boolean) ?? false;

  try {
    const result = await client.deployApplication(appId, force);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              status: "deployment_triggered",
              deployment_uuid: result.deployment_uuid ?? null,
              message: result.message ?? "Deployment triggered successfully",
              app_id: appId,
              force_rebuild: force,
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
