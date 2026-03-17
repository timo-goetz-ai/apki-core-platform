import { NextRequest } from "next/server";
import { MODELS, DEFAULT_MODEL, getModelsByProvider } from "@/lib/chat-models";

export const dynamic = "force-dynamic";

// ── API Keys & Endpoints ──────────────────────────────────────────────────────
const OPENROUTER_KEY  = process.env.OPENROUTER_API_KEY ?? "";
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY  ?? "";
const GOOGLE_AI_KEY   = process.env.GOOGLE_AI_API_KEY  ?? "";
const OLLAMA_BASE     = process.env.OLLAMA_BASE_URL     ?? "http://ollama:11434";
const ADMIN_BASE      = process.env.NEXT_PUBLIC_BASE_DOMAIN
  ? `https://admin.${process.env.NEXT_PUBLIC_BASE_DOMAIN}`
  : "http://localhost:3000";

// ── Shared types ──────────────────────────────────────────────────────────────
type ChatMessage = { role: string; content: string };

// ── Tool definitions (OpenAI format) ─────────────────────────────────────────
const TOOLS_OPENAI = [
  { type: "function", function: { name: "get_service_health",   description: "Gesundheitsstatus aller 25+ Services (online/offline/latenz).", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "list_docker_containers", description: "Alle Docker-Container mit Name, Status und Image.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_coolify_services",  description: "Alle Coolify-Apps mit Status.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_cloudflare_zones",  description: "Cloudflare DNS-Zonen und Status.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_github_stats",      description: "GitHub Repository-Statistiken.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "get_n8n_webhooks",      description: "Konfigurierte n8n Webhooks.", parameters: { type: "object", properties: {} } } },
  { type: "function", function: { name: "docker_action", description: "Docker-Container starten, stoppen oder restarten.", parameters: { type: "object", required: ["container_id", "action"], properties: { container_id: { type: "string" }, action: { type: "string", enum: ["start", "stop", "restart"] } } } } },
];

// Anthropic tool format (input_schema instead of parameters)
const TOOLS_ANTHROPIC = TOOLS_OPENAI.map(t => ({
  name: t.function.name,
  description: t.function.description,
  input_schema: t.function.parameters,
}));

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM = `Du bist der KI-Assistent des Admin-Dashboards von Timo Götz (automation-plus-ki.de).
Du hast Tools für: Service-Health, Docker Container, Coolify Apps, Cloudflare DNS, GitHub Stats, n8n Webhooks, Docker Aktionen.
Server: Hetzner CPX42, Nürnberg, 46.224.145.109 · Stack: Traefik, Coolify, Docker, n8n, NocoDB, Grafana, Prometheus, Authentik.
Verhalte dich proaktiv: Ruf Tools direkt auf wenn der Nutzer nach Status fragt. Antworte auf Deutsch, präzise und klar.`;

// ── Tool executor ─────────────────────────────────────────────────────────────
async function executeTool(name: string, args: Record<string, string>): Promise<string> {
  const apiKey = process.env.DASHBOARD_API_KEY ?? "";
  const h: Record<string, string> = { "Content-Type": "application/json", ...(apiKey ? { "x-api-key": apiKey } : {}) };
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? ADMIN_BASE;
  try {
    switch (name) {
      case "get_service_health": {
        const r = await fetch(`${base}/api/services`, { headers: h, signal: AbortSignal.timeout(10000) });
        const d = await r.json() as Record<string, { status: string; latency?: number }>;
        const entries = Object.entries(d);
        const online = entries.filter(([, v]) => v.status === "online").length;
        return `${online}/${entries.length} online:\n` + entries.map(([k, v]) => `${k}: ${v.status}${v.latency ? ` (${v.latency}ms)` : ""}`).join("\n");
      }
      case "list_docker_containers": {
        const r = await fetch(`${base}/api/docker/containers`, { headers: h, signal: AbortSignal.timeout(8000) });
        const d = await r.json() as { containers: Array<{ Names: string[]; State: string; Image: string }> };
        return `${(d.containers ?? []).length} Container:\n` + (d.containers ?? []).slice(0, 30).map(c => `${c.Names?.[0]?.replace("/", "") ?? "?"} — ${c.State} — ${c.Image?.split(":")[0]}`).join("\n");
      }
      case "get_coolify_services": {
        const r = await fetch(`${base}/api/coolify/services`, { headers: h, signal: AbortSignal.timeout(8000) });
        const d = await r.json() as { services: Array<{ name: string; status: string; kind: string; fqdn?: string }> };
        return `${(d.services ?? []).length} Apps:\n` + (d.services ?? []).map(s => `${s.name} [${s.kind}] — ${s.status}${s.fqdn ? ` → ${s.fqdn}` : ""}`).join("\n");
      }
      case "get_cloudflare_zones": {
        const r = await fetch(`${base}/api/cloudflare/zones`, { headers: h, signal: AbortSignal.timeout(8000) });
        const d = await r.json() as { zones: Array<{ name: string; status: string; plan: string }> };
        return "Zonen:\n" + (d.zones ?? []).map(z => `${z.name} — ${z.status} (${z.plan})`).join("\n");
      }
      case "get_github_stats": {
        const r = await fetch(`${base}/api/github/stats`, { headers: h, signal: AbortSignal.timeout(8000) });
        const d = await r.json() as { stats: Record<string, unknown> };
        return `GitHub:\n${JSON.stringify(d.stats, null, 2)}`;
      }
      case "get_n8n_webhooks": {
        const r = await fetch(`${base}/api/n8n/webhooks`, { headers: h, signal: AbortSignal.timeout(5000) });
        const d = await r.json() as { webhooks: Array<{ name: string; configured: boolean }> };
        return "Webhooks:\n" + ((d.webhooks ?? []).map(w => `${w.name} — ${w.configured ? "✓" : "✗"}`).join("\n") || "Keine");
      }
      case "docker_action": {
        const r = await fetch(`${base}/api/docker/containers/${args.container_id}/${args.action}`, { method: "POST", headers: h, signal: AbortSignal.timeout(12000) });
        const d = await r.json() as { ok: boolean; status: number };
        return d.ok ? `✓ ${args.container_id} wurde ${args.action === "start" ? "gestartet" : args.action === "stop" ? "gestoppt" : "neugestartet"}.` : `Fehler: HTTP ${d.status}`;
      }
      default: return `Unbekanntes Tool: ${name}`;
    }
  } catch (e) { return `Fehler: ${String(e)}`; }
}

// ── OpenAI-compatible call (OpenRouter + Google AI Studio) ────────────────────
async function* callOpenAICompat(opts: {
  baseUrl: string;
  authHeader: string;
  extraHeaders?: Record<string, string>;
  modelId: string;
  messages: ChatMessage[];
  useTools: boolean;
}): AsyncGenerator<string> {
  const history = [{ role: "system", content: SYSTEM }, ...opts.messages];

  for (let round = 0; round < 5; round++) {
    const res = await fetch(`${opts.baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Authorization": opts.authHeader, "Content-Type": "application/json", ...opts.extraHeaders },
      body: JSON.stringify({
        model: opts.modelId,
        messages: history,
        ...(opts.useTools ? { tools: TOOLS_OPENAI, tool_choice: "auto" } : {}),
        max_tokens: 2048,
        stream: false,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) { yield `\n[Fehler: ${res.status} ${await res.text()}]`; return; }

    const data = await res.json() as {
      choices: Array<{
        finish_reason: string;
        message: {
          role: string; content: string | null;
          tool_calls?: Array<{ id: string; function: { name: string; arguments: string } }>;
        };
      }>;
    };
    const choice = data.choices?.[0];
    if (!choice) return;
    const msg = choice.message;

    if (msg.content) yield msg.content;

    if (choice.finish_reason === "tool_calls" && msg.tool_calls?.length) {
      history.push({ role: "assistant", content: JSON.stringify(msg) });
      for (const tc of msg.tool_calls) {
        yield `\n\n🔧 *${tc.function.name}*…\n`;
        const result = await executeTool(tc.function.name, JSON.parse(tc.function.arguments || "{}") as Record<string, string>);
        yield result;
        history.push({ role: "tool", content: JSON.stringify({ tool_call_id: tc.id, content: result }) });
      }
      continue;
    }
    return;
  }
}

// ── Anthropic Messages API ─────────────────────────────────────────────────────
async function* callAnthropic(modelId: string, messages: ChatMessage[]): AsyncGenerator<string> {
  // Anthropic only accepts 'user' and 'assistant' roles (no 'system' in messages)
  const anthropicMessages = messages.filter(m => m.role === "user" || m.role === "assistant");

  for (let round = 0; round < 5; round++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        system: SYSTEM,
        messages: anthropicMessages,
        tools: TOOLS_ANTHROPIC,
        max_tokens: 2048,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) { yield `\n[Anthropic Fehler: ${res.status} ${await res.text()}]`; return; }

    const data = await res.json() as {
      stop_reason: string;
      content: Array<
        | { type: "text"; text: string }
        | { type: "tool_use"; id: string; name: string; input: Record<string, string> }
      >;
    };

    // Stream text blocks
    for (const block of data.content) {
      if (block.type === "text" && block.text) yield block.text;
    }

    if (data.stop_reason !== "tool_use") return;

    // Collect tool_use blocks
    const toolUseBlocks = data.content.filter(b => b.type === "tool_use") as Array<{ type: "tool_use"; id: string; name: string; input: Record<string, string> }>;
    if (!toolUseBlocks.length) return;

    // Append assistant turn with the full content array
    anthropicMessages.push({ role: "assistant", content: JSON.stringify(data.content) });

    const toolResults: Array<{ type: string; tool_use_id: string; content: string }> = [];
    for (const tu of toolUseBlocks) {
      yield `\n\n🔧 *${tu.name}*…\n`;
      const result = await executeTool(tu.name, tu.input);
      yield result;
      toolResults.push({ type: "tool_result", tool_use_id: tu.id, content: result });
    }

    // Append user turn with tool results
    anthropicMessages.push({ role: "user", content: JSON.stringify(toolResults) });
  }
}

// ── Ollama ────────────────────────────────────────────────────────────────────
async function* callOllama(modelId: string, messages: ChatMessage[]): AsyncGenerator<string> {
  yield `*[${modelId} · Lokal auf Hetzner]*\n\n`;
  const res = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "system", content: SYSTEM }, ...messages],
      stream: false,
      options: { num_predict: 1024 },
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) { yield `\n[Ollama Fehler: ${res.status}]`; return; }
  const data = await res.json() as { message?: { content?: string }; error?: string };
  if (data.error) { yield `\n[Ollama Fehler: ${data.error}]`; return; }
  yield data.message?.content ?? "";
}

// ── GET /api/chat → model list + availability ─────────────────────────────────
export async function GET() {
  let ollamaAvailable: string[] = [];
  try {
    const r = await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(3000) });
    if (r.ok) {
      const d = await r.json() as { models?: Array<{ name: string }> };
      ollamaAvailable = (d.models ?? []).map(m => m.name);
    }
  } catch { /* offline */ }

  const modelsWithStatus = Object.fromEntries(
    Object.entries(MODELS).map(([key, m]) => {
      let available = false;
      if (m.provider === "openrouter") available = !!OPENROUTER_KEY;
      else if (m.provider === "anthropic") available = !!ANTHROPIC_KEY;
      else if (m.provider === "google")    available = !!GOOGLE_AI_KEY;
      else if (m.provider === "ollama")    available = ollamaAvailable.some(n => n.startsWith(m.id.split(":")[0]));
      return [key, { ...m, available }];
    })
  );

  return new Response(JSON.stringify({ models: modelsWithStatus, default: DEFAULT_MODEL }), {
    headers: { "Content-Type": "application/json" },
  });
}

// ── POST /api/chat ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { messages, modelKey } = await req.json() as { messages: ChatMessage[]; modelKey?: string };
  const modelCfg = MODELS[modelKey ?? DEFAULT_MODEL] ?? MODELS[DEFAULT_MODEL];

  // Guard: check required key per provider
  if (modelCfg.provider === "openrouter" && !OPENROUTER_KEY)
    return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY nicht gesetzt" }), { status: 503 });
  if (modelCfg.provider === "anthropic" && !ANTHROPIC_KEY)
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY nicht gesetzt. Bitte in den Settings hinterlegen." }), { status: 503 });
  if (modelCfg.provider === "google" && !GOOGLE_AI_KEY)
    return new Response(JSON.stringify({ error: "GOOGLE_AI_API_KEY nicht gesetzt. Bitte in den Settings hinterlegen." }), { status: 503 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));

      try {
        let gen: AsyncGenerator<string>;

        if (modelCfg.provider === "openrouter") {
          gen = callOpenAICompat({
            baseUrl: "https://openrouter.ai/api/v1",
            authHeader: `Bearer ${OPENROUTER_KEY}`,
            extraHeaders: { "HTTP-Referer": "https://admin.automation-plus-ki.de", "X-Title": "AIOS Admin" },
            modelId: modelCfg.id,
            messages,
            useTools: modelCfg.tools,
          });
        } else if (modelCfg.provider === "google") {
          // Google supports OpenAI-compatible endpoint since 2024
          gen = callOpenAICompat({
            baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
            authHeader: `Bearer ${GOOGLE_AI_KEY}`,
            modelId: modelCfg.id,
            messages,
            useTools: modelCfg.tools,
          });
        } else if (modelCfg.provider === "anthropic") {
          gen = callAnthropic(modelCfg.id, messages);
        } else {
          gen = callOllama(modelCfg.id, messages);
        }

        for await (const chunk of gen) send(chunk);
      } catch (e) {
        send(`\n[Fehler: ${String(e)}]`);
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive" },
  });
}
