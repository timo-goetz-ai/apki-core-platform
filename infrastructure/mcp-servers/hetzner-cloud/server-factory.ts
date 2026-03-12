import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getHetznerClient } from "./hetzner-client.js";
import * as listServers from "./tools/list-servers.js";
import * as getServerDetails from "./tools/get-server-details.js";
import * as createServer from "./tools/create-server.js";
import * as sshCommand from "./tools/ssh-command.js";
import * as restartServer from "./tools/restart-server.js";
import * as getServerStatus from "./tools/get-server-status.js";
import * as manageFirewall from "./tools/manage-firewall.js";
import * as listVolumes from "./tools/list-volumes.js";
import * as createSnapshot from "./tools/create-snapshot.js";
import * as listImages from "./tools/list-images.js";

const allTools = [
  { def: listServers.definition, exec: listServers.execute },
  { def: getServerDetails.definition, exec: getServerDetails.execute },
  { def: createServer.definition, exec: createServer.execute },
  { def: sshCommand.definition, exec: sshCommand.execute },
  { def: restartServer.definition, exec: restartServer.execute },
  { def: getServerStatus.definition, exec: getServerStatus.execute },
  { def: manageFirewall.definition, exec: manageFirewall.execute },
  { def: listVolumes.definition, exec: listVolumes.execute },
  { def: createSnapshot.definition, exec: createSnapshot.execute },
  { def: listImages.definition, exec: listImages.execute },
];

const toolMap = new Map(allTools.map((t) => [t.def.name, t]));

export function createMcpServer(): Server {
  // Verify client is available
  getHetznerClient();

  const server = new Server(
    {
      name: "hetzner-mcp-server",
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
      tools: allTools.map((t) => ({
        name: t.def.name,
        description: t.def.description,
        inputSchema: t.def.inputSchema,
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
            text: `Unknown tool: ${name}. Available: ${allTools.map((t) => t.def.name).join(", ")}`,
          },
        ],
        isError: true,
      };
    }

    try {
      const result = await tool.exec((args ?? {}) as any);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error executing tool ${name}: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}
