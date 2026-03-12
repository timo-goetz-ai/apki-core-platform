import { CoolifyClient, CoolifyApiError } from "../coolify-client.js";

export const definition = {
  name: "get_environment_variables",
  description:
    "Get all environment variables for a Coolify application. Values of sensitive variables may be masked.",
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
    const envVars = await client.listEnvVariables(appId);

    const variables = envVars.map((v) => ({
      key: v.key,
      value: v.is_shown_once ? "********" : v.value,
      is_masked: v.is_shown_once,
      is_build_time: v.is_build_time,
      is_preview: v.is_preview,
      is_literal: v.is_literal,
      created_at: v.created_at,
      updated_at: v.updated_at,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              app_id: appId,
              total: variables.length,
              variables,
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
