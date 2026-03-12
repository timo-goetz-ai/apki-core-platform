import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { CoolifyClient, CoolifyApiError } from "./coolify-client.js";
import { tools, toolMap } from "./tools/index.js";

export interface ServerDeps {
  coolifyClient: CoolifyClient;
}

export function createMcpServer(deps: ServerDeps): Server {
  const server = new Server(
    {
      name: "coolify-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map((t) => ({
        name: t.definition.name,
        description: t.definition.description,
        inputSchema: t.definition.inputSchema,
      })),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    const tool = toolMap.get(name);
    if (!tool) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Unknown tool: ${name}. Available tools: ${tools.map((t) => t.definition.name).join(", ")}`,
          },
        ],
        isError: true,
      };
    }

    try {
      return await tool.handler(deps.coolifyClient, args ?? {});
    } catch (error) {
      const message =
        error instanceof CoolifyApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : String(error);

      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  return server;
}
