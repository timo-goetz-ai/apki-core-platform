import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getHetznerClient } from "../hetzner-client.js";

export interface Args {
  server_id: number;
}

export const definition: Tool = {
  name: "restart_server",
  description:
    "Restart (reboot) a Hetzner Cloud server. This performs a graceful restart.",
  inputSchema: {
    type: "object",
    properties: {
      server_id: {
        type: "number",
        description: "The ID of the server to restart",
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
  const response = await client.rebootServer(args.server_id);

  const action = response.action;
  return {
    server_id: args.server_id,
    action_id: action.id,
    action_command: action.command,
    status: action.status,
    progress: action.progress,
    started: action.started,
    completed: action.completed,
    message: `Server ${args.server_id} restart initiated (Action ID: ${action.id})`,
  };
}
