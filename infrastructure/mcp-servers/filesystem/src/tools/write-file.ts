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
  content: string;
}

export const definition: Tool = {
  name: "write_file",
  description: "Write content to a file (creates or overwrites)",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path to write to" },
      content: { type: "string", description: "Content to write" },
    },
    required: ["path", "content"],
  },
};

export async function execute(args: Args) {
  const resolved = assertAllowed(args.path);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, args.content, "utf-8");
  return { path: resolved, written: args.content.length };
}
