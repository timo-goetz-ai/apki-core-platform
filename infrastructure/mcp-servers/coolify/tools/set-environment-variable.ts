import { CoolifyClient, CoolifyApiError } from "../coolify-client.js";

export const definition = {
  name: "set_environment_variable",
  description:
    "Set or update an environment variable for a Coolify application. If the variable already exists, it will be updated. If it does not exist, it will be created.",
  inputSchema: {
    type: "object" as const,
    properties: {
      app_id: {
        type: "string",
        description: "The UUID of the application",
      },
      key: {
        type: "string",
        description: "The environment variable name (e.g. DATABASE_URL)",
      },
      value: {
        type: "string",
        description: "The environment variable value",
      },
      is_build_time: {
        type: "boolean",
        description: "Whether this variable is available during build time (default: false)",
      },
      is_preview: {
        type: "boolean",
        description: "Whether this variable applies to preview deployments (default: false)",
      },
    },
    required: ["app_id", "key", "value"],
  },
};

export async function handler(
  client: CoolifyClient,
  params: Record<string, unknown>,
) {
  const appId = params.app_id as string;
  const key = params.key as string;
  const value = params.value as string;

  if (!appId || !key || value === undefined) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Error: app_id, key, and value are required",
        },
      ],
      isError: true,
    };
  }

  const isBuildTime = (params.is_build_time as boolean) ?? false;
  const isPreview = (params.is_preview as boolean) ?? false;

  try {
    // Check if variable already exists
    const existing = await client.listEnvVariables(appId);
    const existingVar = existing.find((v) => v.key === key);

    let result;
    let action: string;

    if (existingVar) {
      result = await client.updateEnvVariable(appId, key, value);
      action = "updated";
    } else {
      result = await client.createEnvVariable(appId, key, value, {
        is_build_time: isBuildTime,
        is_preview: isPreview,
      });
      action = "created";
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              success: true,
              action,
              key,
              app_id: appId,
              is_build_time: isBuildTime,
              is_preview: isPreview,
              message:
                result.message ??
                `Environment variable '${key}' ${action} successfully`,
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
