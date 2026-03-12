#!/usr/bin/env node
/**
 * GitHub MCP Server - stdio entry point.
 * This just re-exports the official @modelcontextprotocol/server-github package.
 * For HTTP mode, use http-server.ts.
 */

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Spawn the official GitHub MCP server, forwarding stdio
const child = spawn(
  "npx",
  ["-y", "@modelcontextprotocol/server-github"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
    },
  },
);

child.on("exit", (code) => process.exit(code ?? 1));
