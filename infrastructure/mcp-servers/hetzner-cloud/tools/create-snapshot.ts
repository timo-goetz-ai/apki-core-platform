import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getHetznerClient } from "../hetzner-client.js";

export interface Args {
  server_id: number;
  description?: string;
  labels?: Record<string, string>;
}

export const definition: Tool = {
  name: "create_snapshot",
  description:
    "Create a snapshot (backup image) of a server. Server will be powered off during snapshot creation.",
  inputSchema: {
    type: "object",
    properties: {
      server_id: {
        type: "number",
        description: "The ID of the server to snapshot",
      },
      description: {
        type: "string",
        description: "Optional description for the snapshot image",
      },
      labels: {
        type: "object",
        description: "Optional labels for organizing the snapshot",
      },
    },
    required: ["server_id"],
  },
};

export async function execute(args: Args) {
  if (!args.server_id || typeof args.server_id !== "number") {
    throw new Error("server_id is required and must be a number");
  }

  const client = getHetznerClient();

  try {
    const response = await client.createImage({
      server_id: args.server_id,
      description: args.description || `Snapshot of server ${args.server_id}`,
      type: "snapshot",
      labels: args.labels,
    });

    const action = response.action;
    const image = response.image;

    return {
      snapshot_id: image?.id,
      image_id: image?.id,
      name: image?.name,
      description: image?.description,
      status: "creating",
      action: {
        id: action.id,
        status: action.status,
        progress: action.progress,
      },
      message: `Snapshot creation initiated for server ${args.server_id}`,
      note: "Server will be powered off during snapshot creation. Action progress can be monitored.",
    };
  } catch (error) {
    throw new Error(
      `Failed to create snapshot: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
