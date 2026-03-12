#!/usr/bin/env node
import "dotenv/config";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { isDryRun } from "./core/security.js";
import { createMcpServer } from "./server-factory.js";

async function main() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();

  console.error("===========================================");
  console.error(" Google Workspace MCP Server v1.0.0");
  console.error("===========================================");
  console.error(`  Project: ${process.env.GOOGLE_PROJECT_ID || "(not set)"}`);
  console.error(`  Delegated User: ${process.env.GOOGLE_DELEGATED_USER || "(not set)"}`);
  console.error(`  Dry-Run Mode: ${isDryRun()}`);
  console.error(`  OpenAI: ${process.env.OPENAI_API_KEY ? "configured" : "NOT SET"}`);
  console.error("===========================================");

  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
