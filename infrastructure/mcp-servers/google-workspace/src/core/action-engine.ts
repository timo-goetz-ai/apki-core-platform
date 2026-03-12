import { ParsedAction, ParseResult, parsePrompt } from "./llm-parser.js";
import { guardAction, logAction, getAuditLog } from "./security.js";

// Tool handler registry - populated by server at startup
const toolHandlers = new Map<string, (params: Record<string, unknown>) => Promise<string>>();

export function registerToolHandler(
  name: string,
  handler: (params: Record<string, unknown>) => Promise<string>
): void {
  toolHandlers.set(name, handler);
}

export interface ActionResult {
  action: string;
  status: "executed" | "dry-run" | "blocked" | "error" | "unknown_action";
  result?: string;
  error?: string;
  reasoning: string;
}

export interface EngineResult {
  original_prompt: string;
  results: ActionResult[];
  total: number;
  executed: number;
  blocked: number;
  errors: number;
}

/**
 * Execute a single parsed action through the registered tool handler.
 */
async function executeAction(action: ParsedAction): Promise<ActionResult> {
  const handler = toolHandlers.get(action.action);
  if (!handler) {
    return {
      action: action.action,
      status: "unknown_action",
      error: `No handler registered for "${action.action}"`,
      reasoning: action.reasoning,
    };
  }

  // Check security guard
  const blocked = guardAction(action.action, action.params, action.params.confirmed === true);
  if (blocked) {
    return {
      action: action.action,
      status: blocked.startsWith("[DRY-RUN]") ? "dry-run" : "blocked",
      result: blocked,
      reasoning: action.reasoning,
    };
  }

  try {
    const result = await handler(action.params);
    logAction(action.action, action.params, "executed");
    return {
      action: action.action,
      status: "executed",
      result,
      reasoning: action.reasoning,
    };
  } catch (err: any) {
    logAction(action.action, action.params, "blocked", err.message);
    return {
      action: action.action,
      status: "error",
      error: err.message,
      reasoning: action.reasoning,
    };
  }
}

/**
 * Process a natural language prompt:
 * 1. Parse with LLM into structured actions
 * 2. Execute each action sequentially
 * 3. Return combined results
 */
export async function processPrompt(prompt: string): Promise<EngineResult> {
  const parseResult = await parsePrompt(prompt);

  if (parseResult.actions.length === 0) {
    return {
      original_prompt: prompt,
      results: [],
      total: 0,
      executed: 0,
      blocked: 0,
      errors: 0,
    };
  }

  const results: ActionResult[] = [];
  for (const action of parseResult.actions) {
    const result = await executeAction(action);
    results.push(result);
  }

  return {
    original_prompt: prompt,
    results,
    total: results.length,
    executed: results.filter((r) => r.status === "executed").length,
    blocked: results.filter((r) => r.status === "blocked" || r.status === "dry-run").length,
    errors: results.filter((r) => r.status === "error").length,
  };
}

/**
 * Parse only - return the planned actions without executing.
 */
export async function planPrompt(prompt: string): Promise<ParseResult> {
  return parsePrompt(prompt);
}
