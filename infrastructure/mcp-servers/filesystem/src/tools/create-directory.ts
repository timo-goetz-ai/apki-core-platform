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
  name: "create_directory",
  description: "Create a directory (including parent directories)",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "Directory path to create" },
    },
    required: ["path"],
  },
};

export async function execute(args: Args) {
  const resolved = assertAllowed(args.path);
  await fs.mkdir(resolved, { recursive: true });
  return { path: resolved, created: true };
}
