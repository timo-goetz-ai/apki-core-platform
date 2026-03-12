import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as readFile from "./tools/read-file.js";
import * as writeFile from "./tools/write-file.js";
import * as listDirectory from "./tools/list-directory.js";
import * as createDirectory from "./tools/create-directory.js";
import * as deleteFile from "./tools/delete-file.js";
import * as moveFile from "./tools/move-file.js";
import * as getFileInfo from "./tools/get-file-info.js";

const allTools = [
  { def: readFile.definition, exec: readFile.execute },
  { def: writeFile.definition, exec: writeFile.execute },
  { def: listDirectory.definition, exec: listDirectory.execute },
  { def: createDirectory.definition, exec: createDirectory.execute },
  { def: deleteFile.definition, exec: deleteFile.execute },
  { def: moveFile.definition, exec: moveFile.execute },
  { def: getFileInfo.definition, exec: getFileInfo.execute },
];

const toolMap = new Map(allTools.map((t) => [t.def.name, t]));

export function createMcpServer(): Server {
  const server = new Server(
    { name: "filesystem-mcp-server", version: "1.0.0" },
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
