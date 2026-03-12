import { getCalendar } from "../google-auth.js";

const calendar = () => getCalendar();

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  location?: string;
  attendees?: string[];
  htmlLink?: string;
  status?: string;
}

function parseEvent(e: any): CalendarEvent {
  return {
    id: e.id,
    summary: e.summary || "(no title)",
    description: e.description,
    start: e.start?.dateTime || e.start?.date || "",
    end: e.end?.dateTime || e.end?.date || "",
    location: e.location,
    attendees: (e.attendees || []).map((a: any) => a.email),
    htmlLink: e.htmlLink,
    status: e.status,
  };
}

export async function listEvents(
  calendarId = "primary",
  timeMin?: string,
  timeMax?: string,
  maxResults = 20
): Promise<CalendarEvent[]> {
  const now = new Date().toISOString();
  const res = await calendar().events.list({
    calendarId,
    timeMin: timeMin || now,
    timeMax,
    maxResults,
    singleEvents: true,
    orderBy: "startTime",
  });
  return (res.data.items || []).map(parseEvent);
}

export async function createEvent(
  summary: string,
  start: string,
  end: string,
  options: {
    description?: string;
    location?: string;
    attendees?: string[];
    calendarId?: string;
  } = {}
): Promise<CalendarEvent> {
  const calendarId = options.calendarId || "primary";

  const res = await calendar().events.insert({
    calendarId,
    requestBody: {
      summary,
      description: options.description,
      location: options.location,
      start: { dateTime: start },
      end: { dateTime: end },
      attendees: options.attendees?.map((email) => ({ email })),
    },
  });
  return parseEvent(res.data);
}

export async function updateEvent(
  eventId: string,
  updates: {
    summary?: string;
    description?: string;
    start?: string;
    end?: string;
    location?: string;
    calendarId?: string;
  }
): Promise<CalendarEvent> {
  const calendarId = updates.calendarId || "primary";

  const body: any = {};
  if (updates.summary) body.summary = updates.summary;
  if (updates.description) body.description = updates.description;
  if (updates.location) body.location = updates.location;
  if (updates.start) body.start = { dateTime: updates.start };
  if (updates.end) body.end = { dateTime: updates.end };

  const res = await calendar().events.patch({
    calendarId,
    eventId,
    requestBody: body,
  });
  return parseEvent(res.data);
}

export async function deleteEvent(
  eventId: string,
  calendarId = "primary"
): Promise<void> {
  await calendar().events.delete({ calendarId, eventId });
}

export async function getEvent(
  eventId: string,
  calendarId = "primary"
): Promise<CalendarEvent> {
  const res = await calendar().events.get({ calendarId, eventId });
  return parseEvent(res.data);
}

export async function listCalendars(): Promise<
  { id: string; summary: string; primary: boolean }[]
> {
  const res = await calendar().calendarList.list();
  return (res.data.items || []).map((c: any) => ({
    id: c.id,
    summary: c.summary,
    primary: c.primary || false,
  }));
}
