import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCloudflareClient } from "../cloudflare-client.js";

export interface Args {
  zone_id: string;
}

export const definition: Tool = {
  name: "get_zone_details",
  description: "Get detailed information about a specific DNS zone including nameservers, plan, and status.",
  inputSchema: {
    type: "object",
    properties: {
      zone_id: {
        type: "string",
        description: "The zone ID (get it from list_zones)",
      },
    },
    required: ["zone_id"],
  },
};

export async function execute(args: Args) {
  if (!args.zone_id) {
    throw new Error("zone_id is required");
  }

  const client = getCloudflareClient();
  const response = await client.getZone(args.zone_id);
  const zone = response.result;

  return {
    id: zone.id,
    name: zone.name,
    status: zone.status,
    paused: zone.paused,
    plan: zone.plan?.name,
    name_servers: zone.name_servers,
    original_name_servers: zone.original_name_servers,
    created_on: zone.created_on,
    modified_on: zone.modified_on,
    activated_on: zone.activated_on,
    ssl_status: zone.meta?.ssl_status,
  };
}
