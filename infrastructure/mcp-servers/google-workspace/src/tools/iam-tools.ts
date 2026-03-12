import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as iamClient from "../clients/iam-client.js";
import { guardAction, logAction } from "../core/security.js";

export function registerIAMTools(server: McpServer): void {
  server.tool(
    "iam_list_service_accounts",
    "List all service accounts in the Google Cloud project",
    {},
    async () => {
      const accounts = await iamClient.listServiceAccounts();
      return { content: [{ type: "text", text: JSON.stringify(accounts, null, 2) }] };
    }
  );

  server.tool(
    "iam_create_service_account",
    "Create a new service account",
    {
      account_id: z
        .string()
        .describe("Account ID (lowercase, hyphens allowed, e.g. 'my-worker-sa')"),
      display_name: z.string().describe("Human-readable name"),
    },
    async ({ account_id, display_name }) => {
      const blocked = guardAction("iam_create_service_account", { account_id });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const sa = await iamClient.createServiceAccount(account_id, display_name);
      logAction("iam_create_service_account", { account_id }, "executed");
      return { content: [{ type: "text", text: JSON.stringify(sa, null, 2) }] };
    }
  );

  server.tool(
    "iam_delete_service_account",
    "Delete a service account (DESTRUCTIVE - requires confirmed=true)",
    {
      email: z.string().describe("Service account email"),
      confirmed: z.boolean().default(false),
    },
    async ({ email, confirmed }) => {
      const blocked = guardAction("iam_delete_service_account", { email }, confirmed);
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      await iamClient.deleteServiceAccount(email);
      logAction("iam_delete_service_account", { email }, "executed");
      return { content: [{ type: "text", text: `Deleted service account ${email}` }] };
    }
  );

  server.tool(
    "iam_get_policy",
    "Get the IAM policy (all role bindings) for the project",
    {},
    async () => {
      const policy = await iamClient.getIAMPolicy();
      return { content: [{ type: "text", text: JSON.stringify(policy, null, 2) }] };
    }
  );

  server.tool(
    "iam_assign_role",
    "Assign an IAM role to a member (user, service account, group)",
    {
      member: z
        .string()
        .describe("Member (e.g. 'user:me@domain.com' or 'serviceAccount:sa@project.iam.gserviceaccount.com')"),
      role: z.string().describe("Role (e.g. 'roles/editor', 'roles/storage.admin')"),
    },
    async ({ member, role }) => {
      const blocked = guardAction("iam_assign_role", { member, role });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      await iamClient.assignRole(member, role);
      logAction("iam_assign_role", { member, role }, "executed");
      return { content: [{ type: "text", text: `Assigned ${role} to ${member}` }] };
    }
  );

  server.tool(
    "iam_remove_role",
    "Remove an IAM role from a member (DESTRUCTIVE - requires confirmed=true)",
    {
      member: z.string().describe("Member identifier"),
      role: z.string().describe("Role to remove"),
      confirmed: z.boolean().default(false),
    },
    async ({ member, role, confirmed }) => {
      const blocked = guardAction("iam_remove_role", { member, role }, confirmed);
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      await iamClient.removeRole(member, role);
      logAction("iam_remove_role", { member, role }, "executed");
      return { content: [{ type: "text", text: `Removed ${role} from ${member}` }] };
    }
  );

  server.tool(
    "iam_create_key",
    "Create a new JSON key for a service account (returns base64 key data)",
    {
      email: z.string().describe("Service account email"),
    },
    async ({ email }) => {
      const blocked = guardAction("iam_create_key", { email });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const key = await iamClient.createServiceAccountKey(email);
      logAction("iam_create_key", { email }, "executed");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              email,
              key_data_base64: key.keyData.substring(0, 50) + "... (truncated for security)",
            }),
          },
        ],
      };
    }
  );

  server.tool(
    "iam_list_keys",
    "List all keys for a service account",
    {
      email: z.string().describe("Service account email"),
    },
    async ({ email }) => {
      const keys = await iamClient.listServiceAccountKeys(email);
      return { content: [{ type: "text", text: JSON.stringify(keys, null, 2) }] };
    }
  );

  server.tool(
    "iam_enable_api",
    "Enable a Google Cloud API for the project",
    {
      api_name: z
        .string()
        .describe("API service name (e.g. 'drive.googleapis.com', 'sheets.googleapis.com')"),
    },
    async ({ api_name }) => {
      const blocked = guardAction("iam_enable_api", { api_name });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const result = await iamClient.enableAPI(api_name);
      logAction("iam_enable_api", { api_name }, "executed");
      return { content: [{ type: "text", text: result }] };
    }
  );

  server.tool(
    "iam_list_enabled_apis",
    "List all enabled APIs in the Google Cloud project",
    {},
    async () => {
      const apis = await iamClient.listEnabledAPIs();
      return { content: [{ type: "text", text: JSON.stringify(apis, null, 2) }] };
    }
  );
}
