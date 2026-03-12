import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as slidesClient from "../clients/slides-client.js";
import { guardAction, logAction } from "../core/security.js";

export function registerSlidesTools(server: McpServer): void {
  server.tool(
    "slides_create_presentation",
    "Create a new Google Slides presentation",
    {
      title: z.string().describe("Presentation title"),
      parent_folder_id: z.string().optional().describe("Drive folder ID to place it in"),
    },
    async ({ title, parent_folder_id }) => {
      const blocked = guardAction("slides_create_presentation", { title });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const pres = await slidesClient.createPresentation(title, parent_folder_id);
      logAction("slides_create_presentation", { title }, "executed");
      return { content: [{ type: "text", text: JSON.stringify(pres, null, 2) }] };
    }
  );

  server.tool(
    "slides_get_presentation",
    "Get info about a presentation (title, slide count, slide IDs)",
    {
      presentation_id: z.string().describe("Presentation ID"),
    },
    async ({ presentation_id }) => {
      const pres = await slidesClient.getPresentation(presentation_id);
      return { content: [{ type: "text", text: JSON.stringify(pres, null, 2) }] };
    }
  );

  server.tool(
    "slides_add_slide",
    "Add a new slide to a presentation",
    {
      presentation_id: z.string().describe("Presentation ID"),
      layout: z
        .enum(["BLANK", "TITLE", "TITLE_AND_BODY", "SECTION_HEADER", "BIG_NUMBER"])
        .optional()
        .default("BLANK")
        .describe("Slide layout"),
    },
    async ({ presentation_id, layout }) => {
      const blocked = guardAction("slides_add_slide", { presentation_id, layout });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const slideId = await slidesClient.addSlide(presentation_id, layout);
      logAction("slides_add_slide", { presentation_id, layout }, "executed");
      return { content: [{ type: "text", text: JSON.stringify({ slideId }) }] };
    }
  );

  server.tool(
    "slides_add_text",
    "Add a text box to a specific slide",
    {
      presentation_id: z.string().describe("Presentation ID"),
      slide_id: z.string().describe("Slide object ID"),
      text: z.string().describe("Text content"),
      x: z.number().optional().default(1).describe("X position in inches"),
      y: z.number().optional().default(1).describe("Y position in inches"),
      width: z.number().optional().default(6).describe("Width in inches"),
      height: z.number().optional().default(2).describe("Height in inches"),
    },
    async ({ presentation_id, slide_id, text, x, y, width, height }) => {
      const blocked = guardAction("slides_add_text", { presentation_id, slide_id });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const boxId = await slidesClient.addTextToSlide(presentation_id, slide_id, text, {
        x,
        y,
        width,
        height,
      });
      logAction("slides_add_text", { presentation_id, slide_id }, "executed");
      return { content: [{ type: "text", text: JSON.stringify({ textBoxId: boxId }) }] };
    }
  );

  server.tool(
    "slides_export",
    "Export a presentation as PPTX or PDF (returns base64)",
    {
      presentation_id: z.string().describe("Presentation ID"),
      format: z.enum(["pptx", "pdf"]).optional().default("pptx").describe("Export format"),
    },
    async ({ presentation_id, format }) => {
      const data = await slidesClient.exportPresentation(presentation_id, format);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              presentation_id,
              format,
              content_base64: data.substring(0, 100) + "... (truncated)",
              full_size_bytes: Math.round((data.length * 3) / 4),
            }),
          },
        ],
      };
    }
  );
}
