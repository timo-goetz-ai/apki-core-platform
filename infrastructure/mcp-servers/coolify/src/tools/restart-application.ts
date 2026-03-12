import { CoolifyClient, CoolifyApiError } from "../coolify-client.js";

export const definition = {
  name: "restart_application",
  description:
    "Restart a Coolify application. This restarts the Docker containers associated with the application.",
  inputSchema: {
    type: "object" as const,
    properties: {
      app_id: {
        type: "string",
        description: "The UUID of the application to restart",
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
    const result = await client.restartApplication(appId);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              status: "restart_triggered",
              app_id: appId,
              message:
                result.message ?? "Application restart triggered successfully",
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
