import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCloudflareClient } from "../cloudflare-client.js";

export interface Args {
  zone_id: string;
  record_id: string;
  type?: string;
  name?: string;
  content?: string;
  proxied?: boolean;
  ttl?: number;
  comment?: string;
}

export const definition: Tool = {
  name: "update_dns_record",
  description: "Update an existing DNS record. You can change any field: content, proxied status, TTL, etc.",
  inputSchema: {
    type: "object",
    properties: {
      zone_id: {
        type: "string",
        description: "The zone ID",
      },
      record_id: {
        type: "string",
        description: "The DNS record ID (get it from list_dns_records)",
      },
      type: {
        type: "string",
        description: "New record type",
      },
      name: {
        type: "string",
        description: "New record name",
      },
      content: {
        type: "string",
        description: "New record content (IP or hostname)",
      },
      proxied: {
        type: "boolean",
        description: "Whether to proxy through Cloudflare",
      },
      ttl: {
        type: "number",
        description: "New TTL in seconds (1 = auto)",
      },
      comment: {
        type: "string",
        description: "Updated comment",
      },
    },
    required: ["zone_id", "record_id"],
  },
};

export async function execute(args: Args) {
  if (!args.zone_id) throw new Error("zone_id is required");
  if (!args.record_id) throw new Error("record_id is required");

  const updateData: any = {};
  if (args.type !== undefined) updateData.type = args.type.toUpperCase();
  if (args.name !== undefined) updateData.name = args.name;
  if (args.content !== undefined) updateData.content = args.content;
  if (args.proxied !== undefined) updateData.proxied = args.proxied;
  if (args.ttl !== undefined) updateData.ttl = args.ttl;
  if (args.comment !== undefined) updateData.comment = args.comment;

  const client = getCloudflareClient();
  const response = await client.updateDnsRecord(args.zone_id, args.record_id, updateData);
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
      comment: record.comment,
      modified_on: record.modified_on,
    },
    message: `DNS record updated: ${record.type} ${record.name} -> ${record.content}`,
  };
}
