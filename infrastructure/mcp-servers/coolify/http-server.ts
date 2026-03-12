#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import express from "express";
import dotenv from "dotenv";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { CoolifyClient } from "./coolify-client.js";
import { createMcpServer } from "./server-factory.js";

dotenv.config();

// ── Config ──────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || "3000", 10);
const MCP_API_KEY = process.env.MCP_API_KEY;
const COOLIFY_URL = process.env.COOLIFY_URL;
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;

if (!COOLIFY_URL || !COOLIFY_TOKEN) {
  console.error("Missing COOLIFY_URL or COOLIFY_TOKEN");
  process.exit(1);
}

const coolifyClient = new CoolifyClient({
  baseUrl: COOLIFY_URL,
  token: COOLIFY_TOKEN,
  timeout: 30_000,
});

// ── Auth Middleware ─────────────────────────────────────────────

function bearerAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
): void {
  if (!MCP_API_KEY) {
    next();
    return;
  }

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

// Health endpoint (unauthenticated)
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    server: "coolify-mcp-server",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

// ── MCP Transport (stateful sessions) ───────────────────────────

const transports = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", bearerAuth, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (sessionId && transports.has(sessionId)) {
    const transport = transports.get(sessionId)!;
    await transport.handleRequest(req, res, req.body);
    return;
  }

  // New session
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  const server = createMcpServer({ coolifyClient });
  await server.connect(transport);

  transport.onclose = () => {
    if (transport.sessionId) {
      transports.delete(transport.sessionId);
    }
  };

  await transport.handleRequest(req, res, req.body);

  if (transport.sessionId) {
    transports.set(transport.sessionId, transport);
  }
});

app.get("/mcp", bearerAuth, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "No active session. Send POST /mcp to initialize." });
    return;
  }

  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

app.delete("/mcp", bearerAuth, async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;
  if (!sessionId || !transports.has(sessionId)) {
    res.status(400).json({ error: "No active session." });
    return;
  }

  const transport = transports.get(sessionId)!;
  await transport.handleRequest(req, res);
});

// ── Start ───────────────────────────────────────────────────────

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Coolify MCP Server (HTTP) listening on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`MCP:    http://localhost:${PORT}/mcp`);
  console.log(`Auth:   ${MCP_API_KEY ? "enabled" : "disabled"}`);
});
