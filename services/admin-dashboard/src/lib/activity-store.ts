/**
 * Globaler Activity Feed Store.
 * Sammelt Ereignisse aus allen Dashboard-Modulen (Deploys, Scans, Cloudflare, etc.)
 */

export type ActivityType =
  | "mac-sync"
  | "deploy"
  | "docker-action"
  | "n8n-trigger"
  | "prompt-created"
  | "prompt-used"
  | "github-push"
  | "scanner"
  | "info";

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  detail?: string;
  ts: string;
  ok: boolean;
}

interface ActivityStore {
  events: ActivityEvent[];
}

const MAX_EVENTS = 200;
const g = globalThis as typeof globalThis & { __activityStore?: ActivityStore };
if (!g.__activityStore) g.__activityStore = { events: [] };

export const activityStore = g.__activityStore;

export function pushEvent(type: ActivityType, title: string, detail?: string, ok = true): ActivityEvent {
  const event: ActivityEvent = {
    id:     `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type, title, detail,
    ts: new Date().toISOString(),
    ok,
  };
  activityStore.events.unshift(event);
  if (activityStore.events.length > MAX_EVENTS) {
    activityStore.events = activityStore.events.slice(0, MAX_EVENTS);
  }
  return event;
}
