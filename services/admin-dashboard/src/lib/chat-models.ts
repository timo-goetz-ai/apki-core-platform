export type ModelProvider = 'openrouter' | 'anthropic' | 'google' | 'ollama';

export interface ModelInfo {
  id: string;           // model id sent to the provider API
  label: string;        // display name
  free: boolean;        // zero cost
  tools: boolean;       // supports tool/function calling
  provider: ModelProvider;
  description?: string;
}

// ── OpenRouter — FREE tier only (kein Geld ausgeben) ─────────────────────────
// ── Anthropic — direkt über eigenen API Key / Claude-Abo ─────────────────────
// ── Google — direkt über AI Studio Key ───────────────────────────────────────
// ── Ollama — lokal auf Hetzner CPX42 ─────────────────────────────────────────

export const MODELS: Record<string, ModelInfo> = {

  // ── OpenRouter FREE ───────────────────────────────────────────────────────
  "or-deepseek-r1":   { id: "deepseek/deepseek-r1:free",              label: "DeepSeek R1",         free: true, tools: false, provider: 'openrouter', description: "Reasoning-Modell · kostenlos" },
  "or-gemini-free":   { id: "google/gemini-2.0-flash-exp:free",       label: "Gemini 2.0 Flash",    free: true, tools: true,  provider: 'openrouter', description: "Neuestes Google · kostenlos" },
  "or-llama-free":    { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 70B",       free: true, tools: true,  provider: 'openrouter', description: "Meta Open-Source · kostenlos" },
  "or-llama4":        { id: "meta-llama/llama-4-maverick:free",       label: "Llama 4 Maverick",    free: true, tools: true,  provider: 'openrouter', description: "Llama 4 · kostenlos" },
  "or-qwen-free":     { id: "qwen/qwen-2.5-72b-instruct:free",        label: "Qwen 2.5 72B",        free: true, tools: true,  provider: 'openrouter', description: "Alibaba · kostenlos" },
  "or-mistral-free":  { id: "mistralai/mistral-7b-instruct:free",     label: "Mistral 7B",          free: true, tools: false, provider: 'openrouter', description: "Europäisch · kostenlos" },

  // ── Anthropic (eigener Claude-API-Key) ────────────────────────────────────
  "claude-haiku":     { id: "claude-3-haiku-20240307",     label: "Claude 3 Haiku",     free: false, tools: true, provider: 'anthropic', description: "Schnell · günstiger Einstieg" },
  "claude-sonnet":    { id: "claude-3-5-sonnet-20241022",  label: "Claude 3.5 Sonnet",  free: false, tools: true, provider: 'anthropic', description: "Bestes Allround-Modell" },
  "claude-opus":      { id: "claude-3-opus-20240229",      label: "Claude 3 Opus",      free: false, tools: true, provider: 'anthropic', description: "Maximale Intelligenz" },

  // ── Google AI Studio (eigener API-Key) ────────────────────────────────────
  "gemini-flash":     { id: "gemini-1.5-flash",            label: "Gemini 1.5 Flash",   free: false, tools: true, provider: 'google', description: "Schnell · sehr günstig" },
  "gemini-pro":       { id: "gemini-1.5-pro",              label: "Gemini 1.5 Pro",     free: false, tools: true, provider: 'google', description: "Leistungsstark · Kontext 1M" },
  "gemini-2-flash":   { id: "gemini-2.0-flash",            label: "Gemini 2.0 Flash",   free: false, tools: true, provider: 'google', description: "Neuestes Google-Modell" },

  // ── Lokal / Ollama (Hetzner CPX42) ────────────────────────────────────────
  "ollama-llama":     { id: "llama3.2:3b",   label: "Llama 3.2 3B",  free: true, tools: false, provider: 'ollama', description: "Lokal · privat · 2GB RAM" },
  "ollama-phi":       { id: "phi3:mini",     label: "Phi-3 Mini",    free: true, tools: false, provider: 'ollama', description: "Lokal · Microsoft · 2.2GB" },
  "ollama-qwen":      { id: "qwen2.5:3b",    label: "Qwen 2.5 3B",   free: true, tools: false, provider: 'ollama', description: "Lokal · Alibaba · 2GB" },
};

export const DEFAULT_MODEL = "or-deepseek-r1";

// Helpers
export const getModelsByProvider = (provider: ModelProvider) =>
  Object.entries(MODELS).filter(([, m]) => m.provider === provider);

export const getOllamaModels  = () => getModelsByProvider('ollama');
export const getCloudModels   = () => Object.entries(MODELS).filter(([, m]) => m.provider !== 'ollama');
