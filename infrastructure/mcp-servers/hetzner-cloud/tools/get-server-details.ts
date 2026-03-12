import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getHetznerClient } from "../hetzner-client.js";

export interface Args {
  server_id: number;
}

export const definition: Tool = {
  name: "get_server_details",
  description: "Get detailed information about a specific server",
  inputSchema: {
    type: "object",
    properties: {
      server_id: {
        type: "number",
        description: "The ID of the server",
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
  const response = await client.getServer(args.server_id);

  const server = response.server;
  return {
    server_id: server.id,
    name: server.name,
    status: server.status,
    created: server.created,
    type: {
      name: server.server_type?.name,
      cpu_cores: server.server_type?.cores,
      memory_gb: server.server_type?.memory,
      disk_gb: server.server_type?.disk,
    },
    datacenter: {
      location: server.datacenter?.location?.description,
      name: server.datacenter?.name,
    },
    public_net: {
      ipv4: server.public_net?.ipv4?.ip,
      ipv4_blocked: server.public_net?.ipv4?.blocked,
      ipv6: server.public_net?.ipv6?.ip,
      ipv6_blocked: server.public_net?.ipv6?.blocked,
    },
    networks: server.private_net?.map((net: any) => ({
      id: net.network?.id,
      ip: net.ip,
    })),
    volumes: server.volume_ids || [],
    image: {
      id: server.image?.id,
      name: server.image?.name,
      type: server.image?.type,
      os_flavor: server.image?.os_flavor,
    },
    labels: server.labels,
    outgoing_traffic_percent: server.outgoing_traffic_percent,
    locked: server.locked,
    load_average: server.load_average || null,
    protection: server.protection,
  };
}
