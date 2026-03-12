import { CoolifyClient, CoolifyApiError } from "../coolify-client.js";

export const definition = {
  name: "restore_from_backup",
  description:
    "Restore a Coolify database from a specific backup. This is a potentially destructive operation – the current database state will be replaced with the backup contents.",
  inputSchema: {
    type: "object" as const,
    properties: {
      database_id: {
        type: "string",
        description: "The UUID of the database to restore",
      },
      backup_id: {
        type: "string",
        description: "The UUID of the backup to restore from",
      },
    },
    required: ["database_id", "backup_id"],
  },
};

export async function handler(
  client: CoolifyClient,
  params: Record<string, unknown>,
) {
  const databaseId = params.database_id as string;
  const backupId = params.backup_id as string;

  if (!databaseId || !backupId) {
    return {
      content: [
        {
          type: "text" as const,
          text: "Error: database_id and backup_id are required",
        },
      ],
      isError: true,
    };
  }

  try {
    // Verify the backup exists first
    const backups = await client.listBackups(databaseId);
    const backup = backups.find((b) => b.uuid === backupId);

    if (!backup) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: false,
                message: `Backup '${backupId}' not found for database '${databaseId}'. Use list_backups to see available backups.`,
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }

    if (backup.status !== "success" && backup.status !== "completed") {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                success: false,
                message: `Backup '${backupId}' has status '${backup.status}' and cannot be restored. Only successful backups can be restored.`,
              },
              null,
              2,
            ),
          },
        ],
        isError: true,
      };
    }

    // Coolify's current API doesn't have a dedicated restore endpoint exposed
    // in the public v1 API. We report the backup details and advise the user.
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              status: "restore_info",
              database_id: databaseId,
              backup_id: backupId,
              backup_filename: backup.filename,
              backup_created_at: backup.created_at,
              backup_size: backup.size,
              message:
                "Backup verified and found. Note: The Coolify v1 API currently does not expose a direct restore endpoint. To restore this backup, use the Coolify UI or run the restore manually via the server CLI. The backup file is available on your Coolify server.",
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
