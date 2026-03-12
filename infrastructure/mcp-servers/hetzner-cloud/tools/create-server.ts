import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getHetznerClient } from "../hetzner-client.js";

export interface Args {
  name: string;
  server_type: string;
  image: string;
  location?: string;
  ssh_keys?: number[];
  labels?: Record<string, string>;
}

export const definition: Tool = {
  name: "create_server",
  description: "Create a new Hetzner Cloud server",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Name for the new server",
      },
      server_type: {
        type: "string",
        description: 'Server type (e.g., "cx11", "cx21", "cx41", etc.)',
      },
      image: {
        type: "string",
        description:
          'Image to use (e.g., "ubuntu-22.04", "debian-12", "49" (Ubuntu 22.04), etc.)',
      },
      location: {
        type: "string",
        description: 'Location for the server (e.g., "fsn1" (Falkenstein), "nbg1" (Nuremberg), "hel1" (Helsinki))',
      },
      ssh_keys: {
        type: "array",
        items: { type: "number" },
        description: "SSH key IDs to add to the server",
      },
      labels: {
        type: "object",
        description: "Labels for organizing the server",
      },
    },
    required: ["name", "server_type", "image"],
  },
};

export async function execute(args: Args) {
  if (!args.name || typeof args.name !== "string") {
    throw new Error("name is required and must be a string");
  }
  if (!args.server_type || typeof args.server_type !== "string") {
    throw new Error("server_type is required and must be a string");
  }
  if (!args.image || typeof args.image !== "string") {
    throw new Error("image is required and must be a string");
  }

  const client = getHetznerClient();
  const response = await client.createServer({
    name: args.name,
    server_type: args.server_type,
    image: args.image,
    location: args.location,
    ssh_keys: args.ssh_keys,
    labels: args.labels,
  });

  const server = response.server;
  const action = response.action;

  return {
    server_id: server.id,
    name: server.name,
    status: server.status,
    public_ip: server.public_net?.ipv4?.ip,
    root_password: response.root_password || "Use SSH key authentication",
    action: {
      id: action.id,
      status: action.status,
      progress: action.progress,
    },
    message: "Server creation initiated. Check action status for progress.",
  };
}
