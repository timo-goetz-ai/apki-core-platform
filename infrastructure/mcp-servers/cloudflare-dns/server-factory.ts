import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  Tool,
  TextContent,
} from "@modelcontextprotocol/sdk/types.js";
import { getCloudflareClient } from "./cloudflare-client.js";
import * as listZones from "./tools/list-zones.js";
import * as getZoneDetails from "./tools/get-zone-details.js";
import * as listDnsRecords from "./tools/list-dns-records.js";
import * as createDnsRecord from "./tools/create-dns-record.js";
import * as updateDnsRecord from "./tools/update-dns-record.js";
import * as deleteDnsRecord from "./tools/delete-dns-record.js";
import * as verifyToken from "./tools/verify-token.js";

const toolDefs: Tool[] = [
  listZones.definition,
  getZoneDetails.definition,
  listDnsRecords.definition,
  createDnsRecord.definition,
  updateDnsRecord.definition,
  deleteDnsRecord.definition,
  verifyToken.definition,
];

const executors: Record<string, (args: any) => Promise<unknown>> = {
  list_zones: listZones.execute,
  get_zone_details: getZoneDetails.execute,
  list_dns_records: listDnsRecords.execute,
  create_dns_record: createDnsRecord.execute,
  update_dns_record: updateDnsRecord.execute,
  delete_dns_record: deleteDnsRecord.execute,
  verify_token: verifyToken.execute,
};

export function createMcpServer(): Server {
  getCloudflareClient();

  const server = new Server(
    {
      name: "cloudflare-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: toolDefs };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const toolName = request.params.name;
    const args = request.params.arguments || {};
    const executor = executors[toolName];

    if (!executor) {
      return {
        content: [
          { type: "text", text: `Unknown tool: ${toolName}` } as TextContent,
        ],
        isError: true,
      };
    }

    try {
      const result = await executor(args);
      return {
        content: [
          { type: "text", text: JSON.stringify(result, null, 2) } as TextContent,
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text",
            text: `Error executing tool ${toolName}: ${errorMessage}`,
          } as TextContent,
        ],
        isError: true,
      };
    }
  });

  return server;
}
