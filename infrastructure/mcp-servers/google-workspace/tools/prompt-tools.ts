import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { processPrompt, planPrompt } from "../core/action-engine.js";
import { getAuditLog } from "../core/security.js";

export function registerPromptTools(server: McpServer): void {
  server.tool(
    "prompt_execute",
    "Execute a natural language command. The prompt is parsed by AI into structured actions, then executed safely. Example: 'Create a lead folder for Max Mustermann under 2026/High Ticket'",
    {
      prompt: z.string().describe("Natural language command to execute"),
    },
    async ({ prompt }) => {
      const result = await processPrompt(prompt);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    "prompt_plan",
    "Parse a natural language command into actions WITHOUT executing. Use this to preview what would happen.",
    {
      prompt: z.string().describe("Natural language command to plan"),
    },
    async ({ prompt }) => {
      const plan = await planPrompt(prompt);
      return { content: [{ type: "text", text: JSON.stringify(plan, null, 2) }] };
    }
  );

  server.tool(
    "audit_log",
    "View the action audit log (recent actions executed by this server)",
    {
      limit: z.number().optional().default(50).describe("Number of entries to return"),
    },
    async ({ limit }) => {
      const log = getAuditLog(limit);
      return { content: [{ type: "text", text: JSON.stringify(log, null, 2) }] };
    }
  );
}
