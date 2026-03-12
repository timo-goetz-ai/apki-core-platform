import { CoolifyClient, CoolifyApiError } from "../coolify-client.js";

export const definition = {
  name: "view_logs",
  description:
    "View runtime logs for a Coolify application's Docker container. Returns the latest log lines with timestamps.",
  inputSchema: {
    type: "object" as const,
    properties: {
      app_id: {
        type: "string",
        description: "The UUID of the application",
      },
      lines: {
        type: "number",
        description: "Number of log lines to return (default: 50, max: 500)",
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

  const lines = Math.min((params.lines as number) ?? 50, 500);

  try {
    const logs = await client.getApplicationLogs(appId, lines);

    // The API may return different formats – normalize
    let logContent: string;
    if (typeof logs === "string") {
      logContent = logs;
    } else if (Array.isArray(logs)) {
      logContent = logs
        .map((entry: unknown) => {
          if (typeof entry === "string") return entry;
          if (typeof entry === "object" && entry !== null) {
            const e = entry as Record<string, unknown>;
            const ts = e.timestamp ?? e.created_at ?? "";
            const msg = e.message ?? e.output ?? e.log ?? JSON.stringify(e);
            return ts ? `[${ts}] ${msg}` : String(msg);
          }
          return String(entry);
        })
        .join("\n");
    } else if (typeof logs === "object" && logs !== null) {
      logContent = JSON.stringify(logs, null, 2);
    } else {
      logContent = "No logs available";
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              app_id: appId,
              lines_requested: lines,
              timestamp: new Date().toISOString(),
              logs: logContent,
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
