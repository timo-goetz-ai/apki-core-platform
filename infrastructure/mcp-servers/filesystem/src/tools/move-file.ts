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
  source: string;
  destination: string;
}

export const definition: Tool = {
  name: "move_file",
  description: "Move or rename a file",
  inputSchema: {
    type: "object",
    properties: {
      source: { type: "string", description: "Source path" },
      destination: { type: "string", description: "Destination path" },
    },
    required: ["source", "destination"],
  },
};

export async function execute(args: Args) {
  const src = assertAllowed(args.source);
  const dst = assertAllowed(args.destination);
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.rename(src, dst);
  return { source: src, destination: dst, moved: true };
}
