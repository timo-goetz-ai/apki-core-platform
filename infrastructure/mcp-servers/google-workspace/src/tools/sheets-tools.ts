import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as sheetsClient from "../clients/sheets-client.js";
import { guardAction, logAction } from "../core/security.js";

export function registerSheetsTools(server: McpServer): void {
  server.tool(
    "sheets_create",
    "Create a new Google Spreadsheet",
    {
      title: z.string().describe("Spreadsheet title"),
      sheet_names: z.array(z.string()).optional().default(["Sheet1"]).describe("Tab names"),
      parent_folder_id: z.string().optional().describe("Drive folder to place the spreadsheet in"),
    },
    async ({ title, sheet_names, parent_folder_id }) => {
      const blocked = guardAction("sheets_create", { title });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const info = await sheetsClient.createSpreadsheet(title, sheet_names, parent_folder_id);
      logAction("sheets_create", { title }, "executed");
      return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
    }
  );

  server.tool(
    "sheets_read",
    "Read data from a spreadsheet range (e.g. 'Sheet1!A1:D10')",
    {
      spreadsheet_id: z.string().describe("Spreadsheet ID"),
      range: z.string().describe("Cell range (e.g. 'Sheet1!A1:D10')"),
    },
    async ({ spreadsheet_id, range }) => {
      const data = await sheetsClient.readRange(spreadsheet_id, range);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "sheets_write",
    "Write data to a spreadsheet range. Overwrites existing data.",
    {
      spreadsheet_id: z.string().describe("Spreadsheet ID"),
      range: z.string().describe("Target range (e.g. 'Sheet1!A1')"),
      values: z.array(z.array(z.string())).describe("2D array of cell values"),
    },
    async ({ spreadsheet_id, range, values }) => {
      const blocked = guardAction("sheets_write", { spreadsheet_id, range });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const result = await sheetsClient.writeRange(spreadsheet_id, range, values);
      logAction("sheets_write", { spreadsheet_id, range }, "executed");
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "sheets_append",
    "Append rows to the end of a spreadsheet range",
    {
      spreadsheet_id: z.string().describe("Spreadsheet ID"),
      range: z.string().describe("Sheet name or range (e.g. 'Leads' or 'Sheet1!A:E')"),
      values: z.array(z.array(z.string())).describe("Rows to append (2D array)"),
    },
    async ({ spreadsheet_id, range, values }) => {
      const blocked = guardAction("sheets_append", { spreadsheet_id, range });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const result = await sheetsClient.appendRows(spreadsheet_id, range, values);
      logAction("sheets_append", { spreadsheet_id, range, rowCount: values.length }, "executed");
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
  );

  server.tool(
    "sheets_get_info",
    "Get spreadsheet metadata (title, sheet/tab names)",
    {
      spreadsheet_id: z.string().describe("Spreadsheet ID"),
    },
    async ({ spreadsheet_id }) => {
      const info = await sheetsClient.getSpreadsheetInfo(spreadsheet_id);
      return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
    }
  );

  server.tool(
    "sheets_clear",
    "Clear all data in a spreadsheet range (keeps formatting)",
    {
      spreadsheet_id: z.string().describe("Spreadsheet ID"),
      range: z.string().describe("Range to clear"),
    },
    async ({ spreadsheet_id, range }) => {
      const blocked = guardAction("sheets_clear", { spreadsheet_id, range });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      await sheetsClient.clearRange(spreadsheet_id, range);
      logAction("sheets_clear", { spreadsheet_id, range }, "executed");
      return { content: [{ type: "text", text: `Cleared ${range}` }] };
    }
  );

  server.tool(
    "sheets_add_tab",
    "Add a new sheet/tab to an existing spreadsheet",
    {
      spreadsheet_id: z.string().describe("Spreadsheet ID"),
      title: z.string().describe("Name for the new tab"),
    },
    async ({ spreadsheet_id, title }) => {
      const blocked = guardAction("sheets_add_tab", { spreadsheet_id, title });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      await sheetsClient.addSheet(spreadsheet_id, title);
      logAction("sheets_add_tab", { spreadsheet_id, title }, "executed");
      return { content: [{ type: "text", text: `Added tab "${title}"` }] };
    }
  );
}
