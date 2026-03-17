export type ModelProvider = 'openrouter' | 'ollama';

export interface ModelInfo {
  id: string;           // model id sent to the API
  label: string;        // display name
  free: boolean;        // no cost via OpenRouter
  tools: boolean;       // supports tool/function calling
  provider: ModelProvider;
  description?: string; // short note shown in UI
}

// ── OpenRouter cloud models ──────────────────────────────────────────────────
// ── Local Ollama models (running on Hetzner CPX42) ───────────────────────────

export const MODELS: Record<string, ModelInfo> = {
  // ── DeepSeek ──────────────────────────────────────────────────────────────
  "deepseek-chat":    { id: "deepseek/deepseek-chat",                  label: "DeepSeek V3",          free: false, tools: true,  provider: 'openrouter', description: "Stark, schnell, günstig" },
  "deepseek-r1-free": { id: "deepseek/deepseek-r1:free",               label: "DeepSeek R1",          free: true,  tools: false, provider: 'openrouter', description: "Reasoning-Modell · kostenlos" },
  "deepseek-r1":      { id: "deepseek/deepseek-r1",                    label: "DeepSeek R1 Pro",      free: false, tools: false, provider: 'openrouter', description: "Bestes Reasoning-Modell" },

  // ── Google ────────────────────────────────────────────────────────────────
  "gemini-flash":     { id: "google/gemini-flash-1.5",                 label: "Gemini Flash 1.5",     free: false, tools: true,  provider: 'openrouter', description: "Extrem schnell" },
  "gemini-free":      { id: "google/gemini-2.0-flash-exp:free",        label: "Gemini 2.0 Flash",     free: true,  tools: true,  provider: 'openrouter', description: "Neuestes Google · kostenlos" },
  "gemini-pro":       { id: "google/gemini-pro-1.5",                   label: "Gemini Pro 1.5",       free: false, tools: true,  provider: 'openrouter', description: "Leistungsstarkes Google-Modell" },

  // ── Anthropic ─────────────────────────────────────────────────────────────
  "claude-haiku":     { id: "anthropic/claude-3-haiku",                label: "Claude 3 Haiku",       free: false, tools: true,  provider: 'openrouter', description: "Schnell & präzise" },
  "claude-sonnet":    { id: "anthropic/claude-3.5-sonnet",             label: "Claude 3.5 Sonnet",    free: false, tools: true,  provider: 'openrouter', description: "Bestes Allround-Modell" },

  // ── Meta Llama ────────────────────────────────────────────────────────────
  "llama-free":       { id: "meta-llama/llama-3.3-70b-instruct:free",  label: "Llama 3.3 70B",        free: true,  tools: true,  provider: 'openrouter', description: "Open-Source · kostenlos" },
  "llama-maverick":   { id: "meta-llama/llama-4-maverick:free",        label: "Llama 4 Maverick",     free: true,  tools: true,  provider: 'openrouter', description: "Llama 4 · kostenlos" },

  // ── Mistral ───────────────────────────────────────────────────────────────
  "mistral-free":     { id: "mistralai/mistral-7b-instruct:free",      label: "Mistral 7B",           free: true,  tools: false, provider: 'openrouter', description: "Europäisches Open-Source Modell" },
  "mixtral":          { id: "mistralai/mixtral-8x7b-instruct",         label: "Mixtral 8×7B",         free: false, tools: true,  provider: 'openrouter', description: "MoE-Architektur, stark" },

  // ── Qwen ──────────────────────────────────────────────────────────────────
  "qwen-free":        { id: "qwen/qwen-2.5-72b-instruct:free",         label: "Qwen 2.5 72B",         free: true,  tools: true,  provider: 'openrouter', description: "Alibaba · kostenlos" },

  // ── Local / Ollama ────────────────────────────────────────────────────────
  "ollama-llama":     { id: "llama3.2:3b",                             label: "Llama 3.2 3B",         free: true,  tools: false, provider: 'ollama',      description: "Lokal · privat · 2GB RAM" },
  "ollama-phi":       { id: "phi3:mini",                               label: "Phi-3 Mini",           free: true,  tools: false, provider: 'ollama',      description: "Lokal · Microsoft · 2.2GB" },
  "ollama-qwen":      { id: "qwen2.5:3b",                              label: "Qwen 2.5 3B",          free: true,  tools: false, provider: 'ollama',      description: "Lokal · Alibaba · 2GB" },
};

export const DEFAULT_MODEL = "deepseek-chat";

// Helpers
export const getOllamaModels  = () => Object.entries(MODELS).filter(([, m]) => m.provider === 'ollama');
export const getCloudModels   = () => Object.entries(MODELS).filter(([, m]) => m.provider === 'openrouter');
export const getFreeModels    = () => Object.entries(MODELS).filter(([, m]) => m.free);
