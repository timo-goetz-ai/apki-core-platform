export type ModelProvider = 'anythingllm' | 'anthropic' | 'google' | 'openrouter';

export interface ModelInfo {
  id: string;
  label: string;
  provider: ModelProvider;
  free: boolean;
  tools: boolean;
  description?: string;
}

export const MODELS: Record<string, ModelInfo> = {
  // ── AnythingLLM Workspaces (lokal, kostenlos) ──────────────────────────
  "allm-aios": {
    id: "aios",
    label: "AIOS (Standard)",
    provider: "anythingllm", free: true, tools: false,
    description: "Lokaler LLM-Hub — Haupt-Workspace"
  },
  "allm-research": {
    id: "research",
    label: "Research",
    provider: "anythingllm", free: true, tools: false,
    description: "Lokaler LLM-Hub — Research-Workspace"
  },
  "allm-code": {
    id: "code",
    label: "Code",
    provider: "anythingllm", free: true, tools: false,
    description: "Lokaler LLM-Hub — Code-Workspace"
  },

  // ── Anthropic Direct (eigenes Claude-Abo) ──────────────────────────────
  "claude-haiku": {
    id: "claude-3-haiku-20240307",
    label: "Claude 3 Haiku",
    provider: "anthropic", free: false, tools: true,
    description: "Schnell & effizient — dein Claude-Abo"
  },
  "claude-sonnet": {
    id: "claude-3-5-sonnet-20241022",
    label: "Claude 3.5 Sonnet",
    provider: "anthropic", free: false, tools: true,
    description: "Bestes Modell von Anthropic — dein Claude-Abo"
  },
  "claude-opus": {
    id: "claude-3-opus-20240229",
    label: "Claude 3 Opus",
    provider: "anthropic", free: false, tools: true,
    description: "Maximale Intelligenz — dein Claude-Abo"
  },

  // ── Google AI Studio Direct (eigenes Google-Abo) ───────────────────────
  "gemini-flash": {
    id: "gemini-1.5-flash",
    label: "Gemini 1.5 Flash",
    provider: "google", free: false, tools: true,
    description: "Schnell & günstig — dein AI Studio"
  },
  "gemini-pro": {
    id: "gemini-1.5-pro",
    label: "Gemini 1.5 Pro",
    provider: "google", free: false, tools: true,
    description: "Leistungsstark — dein AI Studio"
  },
  "gemini-2-flash": {
    id: "gemini-2.0-flash",
    label: "Gemini 2.0 Flash",
    provider: "google", free: false, tools: true,
    description: "Neuestes Gemini — dein AI Studio"
  },

  // ── OpenRouter (Multi-Model Gateway) ──────────────────────────────────
  "openrouter-auto": {
    id: "openrouter/auto",
    label: "OpenRouter Auto",
    provider: "openrouter", free: false, tools: true,
    description: "Automatische Modellwahl via OpenRouter"
  },
  "openrouter-llama": {
    id: "meta-llama/llama-3.1-70b-instruct",
    label: "Llama 3.1 70B",
    provider: "openrouter", free: false, tools: true,
    description: "Open-Source Power via OpenRouter"
  },
  "openrouter-mixtral": {
    id: "mistralai/mixtral-8x7b-instruct",
    label: "Mixtral 8x7B",
    provider: "openrouter", free: false, tools: true,
    description: "Schnelles Open-Source Modell via OpenRouter"
  },

};

export const DEFAULT_MODEL = "allm-aios";

/** Orchestrator-Modus: Auto wählt Modell je nach Anwendbarkeit (Tool-Use, Länge, Kosten). */
export const ORCHESTRATOR_AUTO = "auto" as const;

/** Modell-Routing für Auto-Modus: Priorität pro Anwendungsfall */
export const ORCHESTRATOR_ROUTING = {
  /** Einfache Chats, kurze Anfragen → AnythingLLM lokal */
  simple: ["allm-aios", "allm-research"],
  /** Tool-Use, Infrastruktur-Abfragen → Anthropic (function calling) */
  tools: ["claude-haiku", "claude-sonnet", "gemini-2-flash"],
  /** Komplexes Reasoning, lange Kontexte → stärkere Modelle */
  reasoning: ["claude-sonnet", "allm-research", "gemini-pro"],
  /** Fallback / günstige Alternative → OpenRouter */
  fallback: ["openrouter-auto", "openrouter-llama"],
} as const;

export const PROVIDER_META: Record<ModelProvider, { label: string; color: string; badge: string; description: string }> = {
  anythingllm: { label: "AnythingLLM", color: "#22d3ee", badge: "LOKAL", description: "Lokaler LLM-Hub (kostenlos)" },
  anthropic:   { label: "Anthropic", color: "#eb6041", badge: "ABO", description: "Dein Claude-Abo (direkt)" },
  google:      { label: "Google AI Studio", color: "#34d399", badge: "ABO", description: "Dein AI Studio Key (direkt)" },
  openrouter:  { label: "OpenRouter", color: "#a78bfa", badge: "API", description: "Multi-Model Gateway (Pay-per-Use)" },
};

export const getModelsByProvider = (provider: ModelProvider) =>
  Object.entries(MODELS).filter(([, m]) => m.provider === provider);

export const getDefaultForProvider = (provider: ModelProvider): string => {
  const models = getModelsByProvider(provider);
  return models[0]?.[0] ?? DEFAULT_MODEL;
};

/** Resolve modelKey für Auto-Orchestrator: wählt Modell je nach Kontext. */
export function resolveOrchestratorModel(
  modelKey: string,
  options: {
    lastUserMessage?: string;
    hasToolUse?: boolean;
    availableModels?: string[];
  }
): string {
  if (modelKey !== ORCHESTRATOR_AUTO) return modelKey;
  const available = options.availableModels ?? Object.keys(MODELS);
  const msg = (options.lastUserMessage ?? "").toLowerCase();
  const needsTools = options.hasToolUse ?? /container|docker|service|workflow|coolify|grafana|nocodb|n8n|status|starte|zeig|prüfe|trigger/i.test(msg);

  const pickFirst = (keys: readonly string[]) =>
    keys.find((k) => available.includes(k)) ?? DEFAULT_MODEL;

  if (needsTools) return pickFirst(ORCHESTRATOR_ROUTING.tools);
  if (msg.length < 80 && !msg.includes("?")) return pickFirst(ORCHESTRATOR_ROUTING.simple);
  return pickFirst(ORCHESTRATOR_ROUTING.reasoning);
}
