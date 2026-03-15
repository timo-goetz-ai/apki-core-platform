/**
 * Corporate LLM Prompt Store
 * Persistiert System-Prompts global im Dashboard.
 * Upgrade: durch NocoDB / PostgreSQL ersetzen.
 */

export type PromptCategory =
  | "system"
  | "coding"
  | "analysis"
  | "writing"
  | "ops"
  | "customer"
  | "custom";

export interface CorporatePrompt {
  id: string;
  name: string;
  category: PromptCategory;
  content: string;
  model: string;          // z.B. "claude-sonnet-4-6"
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface PromptStore {
  prompts: CorporatePrompt[];
}

const g = globalThis as typeof globalThis & { __promptStore?: PromptStore };
if (!g.__promptStore) {
  g.__promptStore = {
    prompts: [
      {
        id: "sys-senior-engineer",
        name: "Senior Fullstack Engineer",
        category: "coding",
        content:
          "You are a Senior Fullstack Engineer specialized in Next.js, TypeScript, FastAPI, and Docker. " +
          "Write clean, production-ready code. Be concise. Prefer existing patterns. Avoid over-engineering.",
        model: "claude-sonnet-4-6",
        tags: ["coding", "nextjs", "typescript"],
        pinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      },
      {
        id: "sys-devops",
        name: "DevOps & Infrastructure",
        category: "ops",
        content:
          "You are a DevOps engineer experienced with Docker, Hetzner, Coolify, Cloudflare, and GitHub Actions. " +
          "Provide infrastructure-as-code solutions. Focus on security, reliability, and cost efficiency.",
        model: "claude-sonnet-4-6",
        tags: ["devops", "docker", "coolify", "cloudflare"],
        pinned: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        usageCount: 0,
      },
    ],
  };
}

export const promptStore = g.__promptStore;

export function generateId(): string {
  return `prompt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
