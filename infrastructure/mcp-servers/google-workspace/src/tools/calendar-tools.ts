import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as calendarClient from "../clients/calendar-client.js";
import { guardAction, logAction } from "../core/security.js";

export function registerCalendarTools(server: McpServer): void {
  server.tool(
    "calendar_list_events",
    "List upcoming events from Google Calendar",
    {
      calendar_id: z.string().optional().default("primary").describe("Calendar ID (default: primary)"),
      time_min: z.string().optional().describe("Start time (ISO 8601). Defaults to now."),
      time_max: z.string().optional().describe("End time (ISO 8601)"),
      max_results: z.number().optional().default(20),
    },
    async ({ calendar_id, time_min, time_max, max_results }) => {
      const events = await calendarClient.listEvents(calendar_id, time_min, time_max, max_results);
      return { content: [{ type: "text", text: JSON.stringify(events, null, 2) }] };
    }
  );

  server.tool(
    "calendar_create_event",
    "Create a new calendar event",
    {
      summary: z.string().describe("Event title"),
      start: z.string().describe("Start date/time (ISO 8601, e.g. '2026-03-01T10:00:00+01:00')"),
      end: z.string().describe("End date/time (ISO 8601)"),
      description: z.string().optional().describe("Event description"),
      location: z.string().optional().describe("Event location"),
      attendees: z.array(z.string()).optional().describe("List of attendee email addresses"),
      calendar_id: z.string().optional().default("primary"),
    },
    async ({ summary, start, end, description, location, attendees, calendar_id }) => {
      const blocked = guardAction("calendar_create_event", { summary, start });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const event = await calendarClient.createEvent(summary, start, end, {
        description,
        location,
        attendees,
        calendarId: calendar_id,
      });
      logAction("calendar_create_event", { summary, start, end }, "executed");
      return { content: [{ type: "text", text: JSON.stringify(event, null, 2) }] };
    }
  );

  server.tool(
    "calendar_update_event",
    "Update an existing calendar event",
    {
      event_id: z.string().describe("Event ID"),
      summary: z.string().optional().describe("New title"),
      description: z.string().optional(),
      start: z.string().optional().describe("New start time (ISO 8601)"),
      end: z.string().optional().describe("New end time (ISO 8601)"),
      location: z.string().optional(),
      calendar_id: z.string().optional().default("primary"),
    },
    async ({ event_id, summary, description, start, end, location, calendar_id }) => {
      const blocked = guardAction("calendar_update_event", { event_id });
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      const event = await calendarClient.updateEvent(event_id, {
        summary,
        description,
        start,
        end,
        location,
        calendarId: calendar_id,
      });
      logAction("calendar_update_event", { event_id }, "executed");
      return { content: [{ type: "text", text: JSON.stringify(event, null, 2) }] };
    }
  );

  server.tool(
    "calendar_delete_event",
    "Delete a calendar event (DESTRUCTIVE - requires confirmed=true)",
    {
      event_id: z.string().describe("Event ID"),
      calendar_id: z.string().optional().default("primary"),
      confirmed: z.boolean().default(false).describe("Must be true to confirm deletion"),
    },
    async ({ event_id, calendar_id, confirmed }) => {
      const blocked = guardAction("calendar_delete_event", { event_id }, confirmed);
      if (blocked) return { content: [{ type: "text", text: blocked }] };

      await calendarClient.deleteEvent(event_id, calendar_id);
      logAction("calendar_delete_event", { event_id }, "executed");
      return { content: [{ type: "text", text: `Deleted event ${event_id}` }] };
    }
  );

  server.tool(
    "calendar_get_event",
    "Get details of a specific calendar event",
    {
      event_id: z.string().describe("Event ID"),
      calendar_id: z.string().optional().default("primary"),
    },
    async ({ event_id, calendar_id }) => {
      const event = await calendarClient.getEvent(event_id, calendar_id);
      return { content: [{ type: "text", text: JSON.stringify(event, null, 2) }] };
    }
  );

  server.tool(
    "calendar_list_calendars",
    "List all calendars accessible to the account",
    {},
    async () => {
      const calendars = await calendarClient.listCalendars();
      return { content: [{ type: "text", text: JSON.stringify(calendars, null, 2) }] };
    }
  );
}
