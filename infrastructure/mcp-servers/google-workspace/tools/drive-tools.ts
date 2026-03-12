import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as driveClient from "../clients/drive-client.js";
import { guardAction, logAction } from "../core/security.js";

export function registerDriveTools(server: McpServer): void {
  server.tool(
    "drive_list_files",
    "List files in Google Drive, optionally filtered by folder or search query",
    {
      folder_id: z.string().optional().describe("Parent folder ID to list files from"),
      query: z.string().optional().describe("Search query to filter file names"),
      page_size: z.number().optional().default(25).describe("Max results (default 25)"),
    },
    async ({ folder_id, query, page_size }) => {
      const files = await driveClient.listFiles(folder_id, query, page_size);
      return { content: [{ type: "text", text: JSON.stringify(files, null, 2) }] };
    }
  );

  server.tool(
    "drive_search_files",
    "Full-text search across all files in Google Drive",
    {
      query: z.string().describe("Search text to find in file contents and names"),
      page_size: z.number().optional().default(20),
    },
    async ({ query, page_size }) => {
      const files = await driveClient.searchFiles(query, page_size);
      return { content: [{ type: "text", text: JSON.stringify(files, null, 2) }] };
    }
  );

  server.tool(
    "drive_create_folder",
    "Create a new folder in Google Drive",
    {
      name: z.string().describe("Folder name"),
      parent_id: z.string().optional().describe("Parent folder ID"),
    },
    async ({ name, parent_id }) => {
      const blocked = guardAction("drive_create_folder", { name, parent_id });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const folder = await driveClient.createFolder(name, parent_id);
      logAction("drive_create_folder", { name, parent_id }, "executed");
      return { content: [{ type: "text", text: JSON.stringify(folder, null, 2) }] };
    }
  );

  server.tool(
    "drive_create_nested_folders",
    "Create a nested folder path (e.g. '2026/Leads/High Ticket'). Creates any missing folders.",
    {
      path: z.string().describe("Folder path separated by '/' (e.g. '2026/Leads/High Ticket')"),
      root_parent_id: z.string().optional().describe("Root parent folder ID to start from"),
    },
    async ({ path, root_parent_id }) => {
      const parts = path.split("/").filter(Boolean);
      const blocked = guardAction("drive_create_nested_folders", { path });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const folder = await driveClient.createNestedFolders(parts, root_parent_id);
      logAction("drive_create_nested_folders", { path }, "executed");
      return { content: [{ type: "text", text: JSON.stringify(folder, null, 2) }] };
    }
  );

  server.tool(
    "drive_move_file",
    "Move a file or folder to a different parent folder",
    {
      file_id: z.string().describe("ID of file/folder to move"),
      new_parent_id: z.string().describe("Target folder ID"),
    },
    async ({ file_id, new_parent_id }) => {
      const blocked = guardAction("drive_move_file", { file_id, new_parent_id });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const file = await driveClient.moveFile(file_id, new_parent_id);
      logAction("drive_move_file", { file_id, new_parent_id }, "executed");
      return { content: [{ type: "text", text: JSON.stringify(file, null, 2) }] };
    }
  );

  server.tool(
    "drive_upload_file",
    "Upload a base64-encoded file to Google Drive",
    {
      name: z.string().describe("File name with extension"),
      content_base64: z.string().describe("Base64-encoded file content"),
      mime_type: z.string().describe("MIME type (e.g. 'application/pdf')"),
      parent_id: z.string().optional().describe("Target folder ID"),
    },
    async ({ name, content_base64, mime_type, parent_id }) => {
      const blocked = guardAction("drive_upload_file", { name });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const file = await driveClient.uploadFile(name, content_base64, mime_type, parent_id);
      logAction("drive_upload_file", { name, parent_id }, "executed");
      return { content: [{ type: "text", text: JSON.stringify(file, null, 2) }] };
    }
  );

  server.tool(
    "drive_download_file",
    "Download a file from Google Drive as base64",
    {
      file_id: z.string().describe("File ID to download"),
    },
    async ({ file_id }) => {
      const data = await driveClient.downloadFile(file_id);
      return { content: [{ type: "text", text: JSON.stringify({ file_id, content_base64: data }) }] };
    }
  );

  server.tool(
    "drive_get_file_info",
    "Get metadata about a specific file or folder",
    {
      file_id: z.string().describe("File or folder ID"),
    },
    async ({ file_id }) => {
      const info = await driveClient.getFileMetadata(file_id);
      return { content: [{ type: "text", text: JSON.stringify(info, null, 2) }] };
    }
  );

  server.tool(
    "drive_delete_file",
    "Permanently delete a file or folder (DESTRUCTIVE - requires confirmed=true)",
    {
      file_id: z.string().describe("File or folder ID to delete"),
      confirmed: z.boolean().default(false).describe("Must be true to confirm deletion"),
    },
    async ({ file_id, confirmed }) => {
      const blocked = guardAction("drive_delete_file", { file_id }, confirmed);
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      await driveClient.deleteFile(file_id);
      logAction("drive_delete_file", { file_id }, "executed");
      return { content: [{ type: "text", text: `Deleted file ${file_id}` }] };
    }
  );
}
