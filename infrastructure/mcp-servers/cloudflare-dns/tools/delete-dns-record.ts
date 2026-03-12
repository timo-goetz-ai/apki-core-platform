import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getCloudflareClient } from "../cloudflare-client.js";

export interface Args {
  zone_id: string;
  record_id: string;
}

export const definition: Tool = {
  name: "delete_dns_record",
  description: "Delete a DNS record. Use list_dns_records first to find the record_id.",
  inputSchema: {
    type: "object",
    properties: {
      zone_id: {
        type: "string",
        description: "The zone ID",
      },
      record_id: {
        type: "string",
        description: "The DNS record ID to delete (get it from list_dns_records)",
      },
    },
    required: ["zone_id", "record_id"],
  },
};

export async function execute(args: Args) {
  if (!args.zone_id) throw new Error("zone_id is required");
  if (!args.record_id) throw new Error("record_id is required");

  const client = getCloudflareClient();

  // Get record details before deletion for confirmation
  const existing = await client.getDnsRecord(args.zone_id, args.record_id);
  const record = existing.result;

  await client.deleteDnsRecord(args.zone_id, args.record_id);

  return {
    success: true,
    deleted_record: {
      id: record.id,
      type: record.type,
      name: record.name,
      content: record.content,
    },
    message: `DNS record deleted: ${record.type} ${record.name} -> ${record.content}`,
  };
}
