import { CoolifyClient, CoolifyApiError } from "../coolify-client.js";

export const definition = {
  name: "list_backups",
  description:
    "List all backups for a Coolify database. Returns backup IDs, timestamps, status, and file sizes.",
  inputSchema: {
    type: "object" as const,
    properties: {
      database_id: {
        type: "string",
        description:
          "The UUID of the database",
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
    const backups = await client.listBackups(databaseId);

    const summary = backups.map((b) => ({
      backup_id: b.uuid,
      status: b.status,
      filename: b.filename,
      size: b.size,
      created_at: b.created_at,
    }));

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              database_id: databaseId,
              total: summary.length,
              backups: summary,
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
