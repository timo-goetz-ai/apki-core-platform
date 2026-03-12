#!/usr/bin/env node

import "dotenv/config";
import { randomUUID } from "node:crypto";
import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./server-factory.js";

const PORT = parseInt(process.env.PORT || "3000", 10);
const MCP_API_KEY = process.env.MCP_API_KEY;

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

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    server: "google-workspace-mcp-server",
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

  const server = createMcpServer();
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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Google Workspace MCP Server (HTTP) listening on port ${PORT}`);
  console.log(`Auth: ${MCP_API_KEY ? "enabled" : "disabled"}`);
});
