import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as executeQuery from "./tools/execute-query.js";
import * as listTables from "./tools/list-tables.js";
import * as describeTable from "./tools/describe-table.js";
import * as listDatabases from "./tools/list-databases.js";

const allTools = [
  { def: executeQuery.definition, exec: executeQuery.execute },
  { def: listTables.definition, exec: listTables.execute },
  { def: describeTable.definition, exec: describeTable.execute },
  { def: listDatabases.definition, exec: listDatabases.execute },
];

const toolMap = new Map(allTools.map((t) => [t.def.name, t]));

export function createMcpServer(): Server {
  const server = new Server(
    { name: "postgres-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools.map((t) => ({
      name: t.def.name,
      description: t.def.description,
      inputSchema: t.def.inputSchema,
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = toolMap.get(name);
    if (!tool) {
      return {
        content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }
    try {
      const result = await tool.exec((args ?? {}) as any);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (error) {
      return {
        content: [{ type: "text" as const, text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  });

  return server;
}
