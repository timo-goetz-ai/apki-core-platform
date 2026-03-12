import { Tool } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";

const ALLOWED_PATHS = (process.env.ALLOWED_PATHS || "/data").split(",").map((p) => p.trim());

function assertAllowed(filePath: string): string {
  const resolved = path.resolve(filePath);
  if (!ALLOWED_PATHS.some((a) => resolved.startsWith(path.resolve(a)))) {
    throw new Error(`Access denied: ${resolved} is outside allowed paths`);
  }
  return resolved;
}

export interface Args {
  path: string;
}

export const definition: Tool = {
  name: "get_file_info",
  description: "Get metadata about a file or directory",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Path to inspect" },
    },
    required: ["path"],
  },
};

export async function execute(args: Args) {
  const resolved = assertAllowed(args.path);
  const stat = await fs.stat(resolved);
  return {
    path: resolved,
    type: stat.isDirectory() ? "directory" : "file",
    size: stat.size,
    created: stat.birthtime.toISOString(),
    modified: stat.mtime.toISOString(),
    mode: stat.mode.toString(8),
  };
}
