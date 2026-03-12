#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";

import { CoolifyClient } from "./coolify-client.js";
import { createMcpServer } from "./server-factory.js";

dotenv.config();

const COOLIFY_URL = process.env.COOLIFY_URL;
const COOLIFY_TOKEN = process.env.COOLIFY_TOKEN;

if (!COOLIFY_URL || !COOLIFY_TOKEN) {
  console.error(
    "Missing required environment variables: COOLIFY_URL and COOLIFY_TOKEN must be set.",
  );
  console.error("See .env.example for reference.");
  process.exit(1);
}

const coolifyClient = new CoolifyClient({
  baseUrl: COOLIFY_URL,
  token: COOLIFY_TOKEN,
  timeout: 30_000,
});

async function main() {
  const server = createMcpServer({ coolifyClient });
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Coolify MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
