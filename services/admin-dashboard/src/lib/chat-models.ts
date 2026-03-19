export type ModelProvider = 'openrouter' | 'anthropic' | 'google';

export interface ModelInfo {
  id: string;
  label: string;
  provider: ModelProvider;
  free: boolean;
  tools: boolean;
  description?: string;
}

export const MODELS: Record<string, ModelInfo> = {
  // ── OpenRouter FREE Tier (primary, no cost) ────────────────────────────
  "or-deepseek-r1": {
    id: "deepseek/deepseek-r1:free",
    label: "DeepSeek R1",
    provider: "openrouter", free: true, tools: false,
    description: "Starkes Reasoning-Modell, kostenlos"
  },
  "or-gemini-free": {
    id: "google/gemini-2.0-flash-exp:free",
    label: "Gemini 2.0 Flash",
    provider: "openrouter", free: true, tools: true,
    description: "Schnell & multimodal, kostenlos"
  },
  "or-llama-free": {
    id: "meta-llama/llama-3.3-70b-instruct:free",
    label: "Llama 3.3 70B",
    provider: "openrouter", free: true, tools: true,
    description: "Meta's bestes open-source Modell, kostenlos"
  },
  "or-llama4": {
    id: "meta-llama/llama-4-maverick:free",
    label: "Llama 4 Maverick",
    provider: "openrouter", free: true, tools: true,
    description: "Llama 4 — neuestes Meta Modell, kostenlos"
  },
  "or-qwen-free": {
    id: "qwen/qwen-2.5-72b-instruct:free",
    label: "Qwen 2.5 72B",
    provider: "openrouter", free: true, tools: true,
    description: "Alibaba's Flaggschiff, kostenlos"
  },
  "or-mistral-free": {
    id: "mistralai/mistral-7b-instruct:free",
    label: "Mistral 7B",
    provider: "openrouter", free: true, tools: false,
    description: "Kompakt & schnell, kostenlos"
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

};

export const DEFAULT_MODEL = "or-deepseek-r1";

/** Orchestrator-Modus: Auto wählt Modell je nach Anwendbarkeit (Tool-Use, Länge, Kosten). */
export const ORCHESTRATOR_AUTO = "auto" as const;

/** Modell-Routing für Auto-Modus: Priorität pro Anwendungsfall */
export const ORCHESTRATOR_ROUTING = {
  /** Einfache Chats, kurze Anfragen → kostenlos & schnell */
  simple: ["or-mistral-free", "or-gemini-free"],
  /** Tool-Use, Infrastruktur-Abfragen → OpenRouter Free mit Tools */
  tools: ["or-gemini-free", "or-llama-free", "or-llama4", "or-deepseek-r1"],
  /** Komplexes Reasoning, lange Kontexte → stärkere Modelle */
  reasoning: ["or-deepseek-r1", "or-qwen-free", "or-llama4", "or-gemini-free"],
} as const;

export const PROVIDER_META: Record<ModelProvider, { label: string; color: string; badge: string; description: string }> = {
  openrouter: { label: "Free Tier", color: "#fbbf24", badge: "FREE", description: "OpenRouter kostenlose Modelle" },
  anthropic:  { label: "Anthropic", color: "#eb6041", badge: "ABO", description: "Dein Claude-Abo (direkt)" },
  google:     { label: "Google AI Studio", color: "#34d399", badge: "ABO", description: "Dein AI Studio Key (direkt)" },
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
