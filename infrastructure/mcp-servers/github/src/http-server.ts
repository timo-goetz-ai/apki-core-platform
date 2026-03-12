#!/usr/bin/env node
/**
 * GitHub MCP Server - HTTP Bridge.
 *
 * Spawns the official @modelcontextprotocol/server-github via StdioClientTransport
 * and exposes it over StreamableHTTPServerTransport for remote access.
 */

import { randomUUID } from "node:crypto";
import express from "express";
import dotenv from "dotenv";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

dotenv.config();

const PORT = parseInt(process.env.PORT || "3000", 10);
const MCP_API_KEY = process.env.MCP_API_KEY;
const GITHUB_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

if (!GITHUB_TOKEN) {
  console.error("GITHUB_PERSONAL_ACCESS_TOKEN is required");
  process.exit(1);
}

// ── Upstream GitHub MCP Client ──────────────────────────────────

let upstreamClient: Client;

async function getUpstreamClient(): Promise<Client> {
  if (upstreamClient) return upstreamClient;

  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      ...process.env as Record<string, string>,
      GITHUB_PERSONAL_ACCESS_TOKEN: GITHUB_TOKEN!,
    },
  });

  upstreamClient = new Client({
    name: "github-bridge",
    version: "1.0.0",
  });

  await upstreamClient.connect(transport);
  return upstreamClient;
}

// ── Create bridged MCP Server ───────────────────────────────────

async function createBridgedServer(): Promise<Server> {
  const client = await getUpstreamClient();
  const toolsResult = await client.listTools();

  const server = new Server(
    {
      name: "github-mcp-server",
      version: "1.0.0",
    },
    {
      capabilities: { tools: {} },
    },
  );

  const toolDefs = toolsResult.tools;

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: toolDefs };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = await client.callTool({ name, arguments: args });
      return result as any;
    } catch (error) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// ── Auth Middleware ──────────────────────────────────────────────

function bearerAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  if (!MCP_API_KEY) { next(); return; }
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing Authorization header" });
    return;
  }
  if (auth.slice(7) !== MCP_API_KEY) {
    res.status(403).json({ error: "Invalid API key" });
    return;
  }
  next();
}

// ── Express App ─────────────────────────────────────────────────

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    server: "github-mcp-server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

const transports = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", bearerAuth, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res, req.body);
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  const server = await createBridgedServer();
  await server.connect(transport);

  transport.onclose = () => {
    if (transport.sessionId) transports.delete(transport.sessionId);
  };

  await transport.handleRequest(req, res, req.body);

  if (transport.sessionId) transports.set(transport.sessionId, transport);
});

app.get("/mcp", bearerAuth, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "No active session. Send POST /mcp to initialize." });
    return;
  }
  await transports.get(sessionId)!.handleRequest(req, res);
});

app.delete("/mcp", bearerAuth, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "No active session." });
    return;
  }
  await transports.get(sessionId)!.handleRequest(req, res);
});

// ── Start ───────────────────────────────────────────────────────

async function main() {
  // Pre-initialize the upstream client to fail fast
  await getUpstreamClient();
  console.log("Upstream GitHub MCP server connected");

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`GitHub MCP Server (HTTP Bridge) listening on port ${PORT}`);
    console.log(`Auth: ${MCP_API_KEY ? "enabled" : "disabled"}`);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
