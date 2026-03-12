import OpenAI from "openai";

const AVAILABLE_ACTIONS = [
  // Drive
  "drive_list_files",
  "drive_search_files",
  "drive_create_folder",
  "drive_create_nested_folders",
  "drive_move_file",
  "drive_upload_file",
  "drive_download_file",
  "drive_delete_file",
  // Sheets
  "sheets_create",
  "sheets_read",
  "sheets_write",
  "sheets_append",
  "sheets_get_info",
  "sheets_clear",
  "sheets_add_tab",
  // Calendar
  "calendar_list_events",
  "calendar_create_event",
  "calendar_update_event",
  "calendar_delete_event",
  "calendar_get_event",
  "calendar_list_calendars",
  // Slides
  "slides_create_presentation",
  "slides_get_presentation",
  "slides_add_slide",
  "slides_add_text",
  "slides_export",
  // Forms
  "forms_get",
  "forms_get_responses",
  "forms_create",
  "forms_add_question",
  // IAM
  "iam_list_service_accounts",
  "iam_create_service_account",
  "iam_delete_service_account",
  "iam_get_policy",
  "iam_assign_role",
  "iam_remove_role",
  "iam_create_key",
  "iam_list_keys",
  "iam_enable_api",
  "iam_list_enabled_apis",
] as const;

export interface ParsedAction {
  action: string;
  params: Record<string, unknown>;
  reasoning: string;
}

export interface ParseResult {
  actions: ParsedAction[];
  original_prompt: string;
}

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY not set");
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

const SYSTEM_PROMPT = `You are a structured action parser for a Google Workspace automation system.

Given a natural language prompt, you MUST return a JSON object with:
- "actions": an array of action objects, each with:
  - "action": one of the available action names (see list below)
  - "params": the parameters for that action
  - "reasoning": brief explanation of why this action was chosen

AVAILABLE ACTIONS:
${AVAILABLE_ACTIONS.join("\n")}

RULES:
1. ONLY use actions from the list above. Never invent new actions.
2. If the prompt requires multiple steps, return multiple actions in order.
3. If you cannot map the prompt to any action, return an empty actions array.
4. For destructive actions (delete, remove), always set confirmed=false so the user must confirm.
5. Be precise with parameter values - use exactly what the user specified.
6. For dates, use ISO 8601 format.

EXAMPLES:
Prompt: "Create a new lead folder for Max Mustermann under 2026/High Ticket"
Response: {"actions":[{"action":"drive_create_nested_folders","params":{"path":"2026/High Ticket/Max Mustermann"},"reasoning":"Creating nested folder path for lead organization"}]}

Prompt: "List my events for next week"
Response: {"actions":[{"action":"calendar_list_events","params":{"time_min":"<next monday ISO>","time_max":"<next sunday ISO>"},"reasoning":"Listing calendar events for the upcoming week"}]}

Prompt: "Add a row to the leads sheet with John Doe, john@example.com, Premium"
Response: {"actions":[{"action":"sheets_append","params":{"spreadsheet_id":"<needs to be provided>","range":"Leads","values":[["John Doe","john@example.com","Premium"]]},"reasoning":"Appending new lead data to spreadsheet"}]}`;

export async function parsePrompt(prompt: string): Promise<ParseResult> {
  const openai = getOpenAI();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0,
    max_tokens: 2000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return { actions: [], original_prompt: prompt };
  }

  const parsed = JSON.parse(content);

  // Validate that all actions are in the allowed list
  const validActions = (parsed.actions || []).filter((a: ParsedAction) =>
    (AVAILABLE_ACTIONS as readonly string[]).includes(a.action)
  );

  return {
    actions: validActions,
    original_prompt: prompt,
  };
}
