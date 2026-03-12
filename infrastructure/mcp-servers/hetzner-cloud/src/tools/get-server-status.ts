import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getHetznerClient } from "../hetzner-client.js";

export interface Args {
  server_id: number;
}

export const definition: Tool = {
  name: "get_server_status",
  description:
    "Get the current status of a server including uptime and resource usage metrics",
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
  const serverResponse = await client.getServer(args.server_id);
  const server = serverResponse.server;

  // Try to get metrics
  let metrics = null;
  try {
    const cpuMetrics = await client.getServerMetrics(args.server_id, "cpu");
    const networkMetrics = await client.getServerMetrics(
      args.server_id,
      "network"
    );
    metrics = {
      cpu: cpuMetrics,
      network: networkMetrics,
    };
  } catch (error) {
    // Metrics might not be available, continue without them
    metrics = null;
  }

  return {
    server_id: args.server_id,
    name: server.name,
    status: server.status,
    running: server.status === "running",
    uptime_seconds: server.load_average ? Date.now() - new Date(server.created).getTime() : null,
    load_average: server.load_average || [0, 0, 0],
    outgoing_traffic_percent: server.outgoing_traffic_percent,
    cpu_cores: server.server_type?.cores,
    memory_gb: server.server_type?.memory,
    disk_gb: server.server_type?.disk,
    public_ip: server.public_net?.ipv4?.ip,
    metrics: metrics,
    last_updated: new Date().toISOString(),
  };
}
