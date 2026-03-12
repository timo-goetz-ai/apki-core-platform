import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCloudflareClient } from "../cloudflare-client.js";

export interface Args {
  zone_id: string;
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
  ttl?: number;
  priority?: number;
  comment?: string;
}

export const definition: Tool = {
  name: "create_dns_record",
  description:
    "Create a new DNS record. Supports A, AAAA, CNAME, MX, TXT, NS, SRV records. " +
    "Use proxied=false for 'DNS only' (grey cloud) or proxied=true for Cloudflare proxy (orange cloud). " +
    "For subdomains pointing to a server IP, use type=A with the server IP as content.",
  inputSchema: {
    type: "object",
    properties: {
      zone_id: {
        type: "string",
        description: "The zone ID (get it from list_zones)",
      },
      type: {
        type: "string",
        description: "Record type: A, AAAA, CNAME, MX, TXT, NS, SRV",
      },
      name: {
        type: "string",
        description: "DNS record name (e.g., 'coolify' for coolify.domain.de, or '@' for root)",
      },
      content: {
        type: "string",
        description: "Record content (IP address for A/AAAA, hostname for CNAME, text for TXT)",
      },
      proxied: {
        type: "boolean",
        description: "Whether to proxy through Cloudflare (orange cloud). Default: false (DNS only / grey cloud)",
      },
      ttl: {
        type: "number",
        description: "TTL in seconds. 1 = auto. Default: 1 (auto)",
      },
      priority: {
        type: "number",
        description: "Priority (required for MX and SRV records)",
      },
      comment: {
        type: "string",
        description: "Optional comment for the record",
      },
    },
    required: ["zone_id", "type", "name", "content"],
  },
};

export async function execute(args: Args) {
  if (!args.zone_id) throw new Error("zone_id is required");
  if (!args.type) throw new Error("type is required");
  if (!args.name) throw new Error("name is required");
  if (!args.content) throw new Error("content is required");

  const client = getCloudflareClient();
  const response = await client.createDnsRecord(args.zone_id, {
    type: args.type.toUpperCase(),
    name: args.name,
    content: args.content,
    proxied: args.proxied ?? false,
    ttl: args.ttl || 1,
    priority: args.priority,
    comment: args.comment,
  });

  const record = response.result;
  return {
    success: true,
    record: {
      id: record.id,
      type: record.type,
      name: record.name,
      content: record.content,
      proxied: record.proxied,
      ttl: record.ttl,
      priority: record.priority,
      comment: record.comment,
      created_on: record.created_on,
    },
    message: `DNS record created: ${record.type} ${record.name} -> ${record.content} (proxied: ${record.proxied})`,
  };
}
