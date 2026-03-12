/**
 * Security layer - permission guard, audit logging, dry-run mode.
 */

export interface AuditEntry {
  timestamp: string;
  action: string;
  params: Record<string, unknown>;
  result: "executed" | "dry-run" | "blocked";
  reason?: string;
}

const auditLog: AuditEntry[] = [];

// Actions that require explicit confirmation (destructive)
const DESTRUCTIVE_ACTIONS = new Set([
  "drive_delete_file",
  "drive_delete_folder",
  "iam_delete_service_account",
  "iam_remove_role",
  "iam_rotate_keys",
  "sheets_delete_spreadsheet",
  "calendar_delete_event",
  "slides_delete_presentation",
]);

export function isDryRun(): boolean {
  return process.env.DRY_RUN === "true";
}

export function isDestructive(action: string): boolean {
  return DESTRUCTIVE_ACTIONS.has(action);
}

export function logAction(
  action: string,
  params: Record<string, unknown>,
  result: AuditEntry["result"],
  reason?: string
): void {
  const entry: AuditEntry = {
    timestamp: new Date().toISOString(),
    action,
    params,
    result,
    reason,
  };
  auditLog.push(entry);

  // Keep last 1000 entries in memory
  if (auditLog.length > 1000) auditLog.shift();

  const prefix = result === "blocked" ? "BLOCKED" : result === "dry-run" ? "DRY-RUN" : "EXEC";
  console.error(`[${prefix}] ${action} | ${JSON.stringify(params)}`);
}

export function getAuditLog(limit = 50): AuditEntry[] {
  return auditLog.slice(-limit);
}

/**
 * Guard: checks dry-run and destructive action safety.
 * Returns null if safe to proceed, or a string message if blocked.
 */
export function guardAction(
  action: string,
  params: Record<string, unknown>,
  confirmed = false
): string | null {
  if (isDryRun()) {
    logAction(action, params, "dry-run");
    return `[DRY-RUN] Would execute: ${action} with ${JSON.stringify(params)}`;
  }

  if (isDestructive(action) && !confirmed) {
    logAction(action, params, "blocked", "destructive action requires confirmation");
    return `BLOCKED: "${action}" is destructive. Pass confirmed=true to proceed.`;
  }

  return null; // safe to proceed
}
