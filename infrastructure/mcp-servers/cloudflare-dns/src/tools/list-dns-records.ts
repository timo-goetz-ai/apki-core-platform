import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCloudflareClient } from "../cloudflare-client.js";

export interface Args {
  zone_id: string;
  type?: string;
  name?: string;
}

export const definition: Tool = {
  name: "list_dns_records",
  description: "List all DNS records for a zone. Can filter by record type (A, AAAA, CNAME, MX, TXT, etc.) or by name.",
  inputSchema: {
    type: "object",
    properties: {
      zone_id: {
        type: "string",
        description: "The zone ID (get it from list_zones)",
      },
      type: {
        type: "string",
        description: "Optional: Filter by record type (A, AAAA, CNAME, MX, TXT, NS, SRV, etc.)",
      },
      name: {
        type: "string",
        description: "Optional: Filter by record name (e.g., 'n8n.automation-plus-ki.de')",
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
  const response = await client.listDnsRecords(args.zone_id, {
    type: args.type,
    name: args.name,
  });

  return {
    records: response.result.map((record: any) => ({
      id: record.id,
      type: record.type,
      name: record.name,
      content: record.content,
      proxied: record.proxied,
      ttl: record.ttl,
      priority: record.priority,
      comment: record.comment,
      created_on: record.created_on,
      modified_on: record.modified_on,
    })),
    total: response.result_info?.total_count || response.result.length,
  };
}
