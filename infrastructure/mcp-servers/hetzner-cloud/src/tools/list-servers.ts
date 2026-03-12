import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getHetznerClient } from "../hetzner-client.js";

export interface Args {
  // No arguments for list_servers
}

export const definition: Tool = {
  name: "list_servers",
  description: "List all Hetzner Cloud servers with their basic information",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export async function execute(_args: Args) {
  const client = getHetznerClient();
  const response = await client.listServers();

  return {
    servers: response.servers.map((server: any) => ({
      server_id: server.id,
      name: server.name,
      status: server.status,
      public_ip: server.public_net?.ipv4?.ip || "N/A",
      type: server.server_type?.name,
      location: server.datacenter?.location?.description,
      cpu_cores: server.server_type?.cores,
      memory_gb: server.server_type?.memory,
      disk_gb: server.server_type?.disk,
      created: server.created,
    })),
    total: response.servers.length,
  };
}
