import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCloudflareClient } from "../cloudflare-client.js";

export interface Args {
  name?: string;
}

export const definition: Tool = {
  name: "list_zones",
  description: "List all DNS zones (domains) in your Cloudflare account. Use this to find the zone_id for a domain.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Optional: Filter by domain name (e.g., 'automation-plus-ki.de')",
      },
    },
    required: [],
  },
};

export async function execute(args: Args) {
  const client = getCloudflareClient();
  const response = await client.listZones({ name: args.name, per_page: 50 });

  return {
    zones: response.result.map((zone: any) => ({
      id: zone.id,
      name: zone.name,
      status: zone.status,
      paused: zone.paused,
      plan: zone.plan?.name,
      name_servers: zone.name_servers,
      created_on: zone.created_on,
      modified_on: zone.modified_on,
    })),
    total: response.result_info?.total_count || response.result.length,
  };
}
