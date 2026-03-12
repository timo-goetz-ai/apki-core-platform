import { CoolifyClient, CoolifyApiError } from "../coolify-client.js";

export const definition = {
  name: "trigger_backup",
  description:
    "Trigger a backup for a Coolify database. The database UUID is required. Use list_applications or check Coolify for database UUIDs.",
  inputSchema: {
    type: "object" as const,
    properties: {
      database_id: {
        type: "string",
        description:
          "The UUID of the database to back up",
      },
    },
    required: ["database_id"],
  },
};

export async function handler(
  client: CoolifyClient,
  params: Record<string, unknown>,
) {
  const databaseId = params.database_id as string;
  if (!databaseId) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Error: database_id is required",
        },
      ],
      isError: true,
    };
  }

  try {
    const result = await client.triggerBackup(databaseId);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              status: "backup_triggered",
              database_id: databaseId,
              message:
                result.message ?? "Backup triggered successfully",
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
