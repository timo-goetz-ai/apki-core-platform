export interface ModelInfo {
  id: string;
  label: string;
  free: boolean;
  tools: boolean;
}

export const MODELS: Record<string, ModelInfo> = {
  "deepseek-chat":    { id: "deepseek/deepseek-chat",                 label: "DeepSeek V3",        free: false, tools: true  },
  "deepseek-r1-free": { id: "deepseek/deepseek-r1:free",              label: "DeepSeek R1 (free)", free: true,  tools: false },
  "deepseek-r1":      { id: "deepseek/deepseek-r1",                   label: "DeepSeek R1",        free: false, tools: false },
  "gemini-flash":     { id: "google/gemini-flash-1.5",                label: "Gemini Flash",       free: false, tools: true  },
  "gemini-free":      { id: "google/gemini-2.0-flash-exp:free",       label: "Gemini 2.0 (free)",  free: true,  tools: true  },
  "claude-haiku":     { id: "anthropic/claude-3-haiku",               label: "Claude 3 Haiku",     free: false, tools: true  },
  "claude-sonnet":    { id: "anthropic/claude-3.5-sonnet",            label: "Claude 3.5 Sonnet",  free: false, tools: true  },
  "llama-free":       { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Llama 3.3 (free)",   free: true,  tools: true  },
};

export const DEFAULT_MODEL = "deepseek-chat";
