import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as formsClient from "../clients/forms-client.js";
import { guardAction, logAction } from "../core/security.js";

export function registerFormsTools(server: McpServer): void {
  server.tool(
    "forms_get",
    "Get info about a Google Form (title, question count, URLs)",
    {
      form_id: z.string().describe("Google Form ID"),
    },
    async ({ form_id }) => {
      const form = await formsClient.getForm(form_id);
      return { content: [{ type: "text", text: JSON.stringify(form, null, 2) }] };
    }
  );

  server.tool(
    "forms_get_responses",
    "Get all responses/submissions from a Google Form",
    {
      form_id: z.string().describe("Google Form ID"),
      page_size: z.number().optional().default(50).describe("Max responses to return"),
    },
    async ({ form_id, page_size }) => {
      const responses = await formsClient.getFormResponses(form_id, page_size);
      return { content: [{ type: "text", text: JSON.stringify(responses, null, 2) }] };
    }
  );

  server.tool(
    "forms_create",
    "Create a new Google Form",
    {
      title: z.string().describe("Form title"),
    },
    async ({ title }) => {
      const blocked = guardAction("forms_create", { title });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const form = await formsClient.createForm(title);
      logAction("forms_create", { title }, "executed");
      return { content: [{ type: "text", text: JSON.stringify(form, null, 2) }] };
    }
  );

  server.tool(
    "forms_add_question",
    "Add a question to an existing Google Form",
    {
      form_id: z.string().describe("Form ID"),
      title: z.string().describe("Question text"),
      type: z
        .enum(["SHORT_ANSWER", "PARAGRAPH", "MULTIPLE_CHOICE", "CHECKBOX", "DROPDOWN"])
        .describe("Question type"),
      options: z
        .array(z.string())
        .optional()
        .describe("Answer choices (for MULTIPLE_CHOICE, CHECKBOX, DROPDOWN)"),
    },
    async ({ form_id, title, type, options }) => {
      const blocked = guardAction("forms_add_question", { form_id, title });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      await formsClient.addQuestion(form_id, title, type, options);
      logAction("forms_add_question", { form_id, title, type }, "executed");
      return { content: [{ type: "text", text: `Added question "${title}" to form ${form_id}` }] };
    }
  );
}
