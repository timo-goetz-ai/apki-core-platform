import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { registerDriveTools } from "./tools/drive-tools.js";
import { registerSheetsTools } from "./tools/sheets-tools.js";
import { registerCalendarTools } from "./tools/calendar-tools.js";
import { registerSlidesTools } from "./tools/slides-tools.js";
import { registerFormsTools } from "./tools/forms-tools.js";
import { registerIAMTools } from "./tools/iam-tools.js";
import { registerPromptTools } from "./tools/prompt-tools.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "google-workspace",
    version: "1.0.0",
    description:
      "Google Workspace + Cloud MCP Server: Drive, Sheets, Calendar, Slides, Forms, IAM, and natural language automation engine",
  });

  registerDriveTools(server);
  registerSheetsTools(server);
  registerCalendarTools(server);
  registerSlidesTools(server);
  registerFormsTools(server);
  registerIAMTools(server);
  registerPromptTools(server);

  return server;
}
