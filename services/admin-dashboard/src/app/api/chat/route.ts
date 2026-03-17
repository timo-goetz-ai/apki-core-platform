export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { MODELS, DEFAULT_MODEL } from '@/lib/chat-models';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? '';
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY ?? '';
const GOOGLE_KEY     = process.env.GOOGLE_AI_API_KEY ?? '';
const OLLAMA_URL     = process.env.OLLAMA_BASE_URL ?? 'http://ollama:11434';
const N8N_URL        = process.env.N8N_BASE_URL ?? 'https://n8n.automation-plus-ki.de';
const N8N_KEY        = process.env.N8N_API_KEY ?? '';
const COOLIFY_URL    = process.env.COOLIFY_URL ?? 'https://coolify.automation-plus-ki.de';
const COOLIFY_KEY    = process.env.COOLIFY_API_KEY ?? '';
const CF_TOKEN       = process.env.CLOUDFLARE_API_TOKEN ?? '';

// ─── Tool definitions (OpenAI format) ───────────────────────────────────────
const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_service_health',
      description: 'Check health status of all infrastructure services',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_docker_containers',
      description: 'List all Docker containers with status',
      parameters: { type: 'object', properties: { all: { type: 'boolean', description: 'Include stopped containers' } }, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_coolify_services',
      description: 'List all Coolify managed applications and services',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_cloudflare_zones',
      description: 'List Cloudflare DNS zones and their status',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_github_stats',
      description: 'Get GitHub repository statistics',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_n8n_webhooks',
      description: 'List n8n workflows and webhook configurations',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'docker_action',
      description: 'Start, stop, or restart a Docker container',
      parameters: {
        type: 'object',
        properties: {
          container_id: { type: 'string', description: 'Container ID or name' },
          action: { type: 'string', enum: ['start', 'stop', 'restart'] },
        },
        required: ['container_id', 'action'],
      },
    },
  },
];

const SYSTEM_PROMPT = `Du bist AIOS — der KI-Assistent für die Infrastruktur von automation-plus-ki.de.

Server: Hetzner CPX42 (46.224.145.109), Ubuntu 22.04, 8 vCPU, 16GB RAM
Stack: Docker + Coolify, Traefik reverse proxy

Dienste:
- n8n (Workflows): https://n8n.automation-plus-ki.de
- NocoDB (Datenbank): https://nocodb.automation-plus-ki.de
- Grafana (Monitoring): https://grafana.automation-plus-ki.de
- Prometheus: https://prometheus.automation-plus-ki.de
- Qdrant (Vektoren): https://qdrant.automation-plus-ki.de
- Coolify (Deployment): https://coolify.automation-plus-ki.de
- Appflowy (Docs): eigener Service
- Steel Browser (Scraping): eigener Service
- Vaultwarden (Passwörter): eigener Service
- Mailpit (Mail): eigener Service
- Redis, PostgreSQL: interne Services
- 19 MCP Server: mcp-*.automation-plus-ki.de

Admin Dashboard: https://admin.automation-plus-ki.de

Du hast Zugriff auf Tools um Container zu steuern, Services zu prüfen und Infos abzurufen.
Antworte präzise auf Deutsch. Nutze Markdown für strukturierte Ausgaben.`;

// ─── Tool execution ──────────────────────────────────────────────────────────
async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    switch (name) {
      case 'get_service_health': {
        const services = [
          { name: 'n8n', url: `${N8N_URL}/healthz` },
          { name: 'NocoDB', url: 'https://nocodb.automation-plus-ki.de/api/v1/health' },
          { name: 'Grafana', url: 'https://grafana.automation-plus-ki.de/api/health' },
          { name: 'Coolify', url: `${COOLIFY_URL}/api/v1/version` },
        ];
        const results = await Promise.allSettled(
          services.map(async (s) => {
            const start = Date.now();
            const r = await fetch(s.url, { signal: AbortSignal.timeout(4000) });
            return { name: s.name, status: r.ok ? 'online' : 'degraded', latency: Date.now() - start };
          })
        );
        const data = results.map((r, i) =>
          r.status === 'fulfilled' ? r.value : { name: services[i].name, status: 'offline', latency: 0 }
        );
        return JSON.stringify(data, null, 2);
      }
      case 'list_docker_containers': {
        const url = `https://admin.automation-plus-ki.de/api/docker/containers${args.all ? '?all=true' : ''}`;
        const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
        const data = await r.json();
        return JSON.stringify(data, null, 2);
      }
      case 'get_coolify_services': {
        if (!COOLIFY_KEY) return 'Coolify API key not configured';
        const r = await fetch(`${COOLIFY_URL}/api/v1/applications`, {
          headers: { Authorization: `Bearer ${COOLIFY_KEY}` },
          signal: AbortSignal.timeout(8000),
        });
        const data = await r.json();
        return JSON.stringify(data, null, 2);
      }
      case 'get_cloudflare_zones': {
        if (!CF_TOKEN) return 'Cloudflare token not configured';
        const r = await fetch('https://api.cloudflare.com/client/v4/zones?per_page=20', {
          headers: { Authorization: `Bearer ${CF_TOKEN}` },
          signal: AbortSignal.timeout(8000),
        });
        const data = await r.json();
        return JSON.stringify(data?.result?.map((z: { name: string; status: string; id: string }) => ({ name: z.name, status: z.status, id: z.id })) ?? [], null, 2);
      }
      case 'get_n8n_webhooks': {
        if (!N8N_KEY || N8N_KEY === 'BITTE_KONFIGURIEREN') return 'n8n API key not configured';
        const r = await fetch(`${N8N_URL}/api/v1/workflows?active=true&limit=20`, {
          headers: { 'X-N8N-API-KEY': N8N_KEY },
          signal: AbortSignal.timeout(8000),
        });
        const data = await r.json();
        return JSON.stringify(data, null, 2);
      }
      case 'get_github_stats': {
        const r = await fetch('https://api.github.com/users/timogoetz1988/repos?sort=updated&per_page=10', {
          headers: { 'User-Agent': 'AIOS-Dashboard' },
          signal: AbortSignal.timeout(8000),
        });
        const repos = await r.json();
        return JSON.stringify(repos.map((repo: { name: string; stargazers_count: number; updated_at: string; language: string }) => ({
          name: repo.name, stars: repo.stargazers_count, updated: repo.updated_at, language: repo.language
        })), null, 2);
      }
      case 'docker_action': {
        const r = await fetch(`https://admin.automation-plus-ki.de/api/docker/containers/${args.container_id}/${args.action}`, {
          method: 'POST',
          headers: { 'X-API-Key': process.env.DASHBOARD_API_KEY ?? '' },
          signal: AbortSignal.timeout(10000),
        });
        return r.ok ? `✅ ${args.action} erfolgreich für ${args.container_id}` : `❌ Fehler: ${r.status}`;
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (e) {
    return `Tool error: ${(e as Error).message}`;
  }
}

// ─── OpenAI-compatible call (OpenRouter + Google AI Studio) ─────────────────
async function callOpenAICompat(config: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  useTools: boolean;
  extraHeaders?: Record<string, string>;
}): Promise<Response> {
  const body: Record<string, unknown> = {
    model: config.model,
    messages: config.messages,
    stream: true,
    max_tokens: 2048,
  };
  if (config.useTools) {
    body.tools = TOOLS;
    body.tool_choice = 'auto';
  }
  return fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
      ...config.extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

// ─── Ollama call ─────────────────────────────────────────────────────────────
async function callOllama(model: string, messages: Array<{ role: string; content: string }>): Promise<Response> {
  return fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true }),
  });
}

// ─── Anthropic native call with agentic loop ─────────────────────────────────
async function* callAnthropicStream(
  model: string,
  messages: Array<{ role: string; content: string }>
): AsyncGenerator<string> {
  // Convert tools to Anthropic format
  const anthropicTools = TOOLS.map((t) => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));

  // Anthropic messages (no system role in messages array)
  let anthropicMessages: Array<{ role: string; content: unknown }> = messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let round = 0; round < 5; round++) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: SYSTEM_PROMPT,
        messages: anthropicMessages,
        tools: anthropicTools,
        max_tokens: 2048,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      yield `❌ Anthropic Fehler: ${resp.status} — ${err}`;
      return;
    }

    const data = await resp.json();
    const textParts = data.content?.filter((c: { type: string }) => c.type === 'text') ?? [];
    const toolParts = data.content?.filter((c: { type: string }) => c.type === 'tool_use') ?? [];

    // Yield text
    for (const part of textParts) {
      yield part.text;
    }

    if (data.stop_reason !== 'tool_use' || toolParts.length === 0) break;

    // Execute tools
    yield '\n';
    anthropicMessages.push({ role: 'assistant', content: data.content });
    const toolResults: Array<{ type: string; tool_use_id: string; content: string }> = [];

    for (const toolUse of toolParts) {
      yield `\n🔧 *${toolUse.name}*…\n`;
      const result = await executeTool(toolUse.name, toolUse.input ?? {});
      toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result });
    }

    anthropicMessages.push({ role: 'user', content: toolResults });
  }
}

// ─── GET — return available models ──────────────────────────────────────────
export async function GET() {
  const available = Object.entries(MODELS).map(([key, m]) => {
    let isAvailable = false;
    if (m.provider === 'openrouter') isAvailable = !!OPENROUTER_KEY;
    else if (m.provider === 'anthropic') isAvailable = !!ANTHROPIC_KEY;
    else if (m.provider === 'google') isAvailable = !!GOOGLE_KEY;
    else if (m.provider === 'ollama') isAvailable = true; // always try
    return { key, ...m, available: isAvailable };
  });
  return NextResponse.json({ models: available });
}

// ─── POST — chat ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { messages, modelKey } = await req.json();

  const key = modelKey ?? DEFAULT_MODEL;
  const model = MODELS[key];
  if (!model) {
    return NextResponse.json({ error: `Unknown model: ${key}` }, { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (text: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`));
      };
      const sendTool = (text: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ tool: text })}\n\n`));
      };

      try {
        // ── Anthropic ───────────────────────────────────────────────────
        if (model.provider === 'anthropic') {
          if (!ANTHROPIC_KEY) {
            send('❌ Anthropic API Key nicht konfiguriert. Bitte in den Einstellungen hinterlegen.');
            controller.close();
            return;
          }
          for await (const chunk of callAnthropicStream(model.id, messages)) {
            send(chunk);
          }
          controller.close();
          return;
        }

        // ── Ollama ──────────────────────────────────────────────────────
        if (model.provider === 'ollama') {
          const resp = await callOllama(model.id, [
            { role: 'system', content: SYSTEM_PROMPT },
            ...messages,
          ]);
          if (!resp.ok || !resp.body) {
            send(`❌ Ollama nicht erreichbar (${resp.status}). Läuft der Ollama-Container?`);
            controller.close();
            return;
          }
          const reader = resp.body.getReader();
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const lines = dec.decode(value).split('\n').filter(Boolean);
            for (const line of lines) {
              try {
                const json = JSON.parse(line);
                if (json.message?.content) send(json.message.content);
              } catch { /* ignore */ }
            }
          }
          controller.close();
          return;
        }

        // ── OpenRouter / Google (OpenAI-compatible, with agentic loop) ──
        const baseUrl = model.provider === 'google'
          ? 'https://generativelanguage.googleapis.com/v1beta/openai'
          : 'https://openrouter.ai/api/v1';
        const apiKey = model.provider === 'google' ? GOOGLE_KEY : OPENROUTER_KEY;
        const extraHeaders: Record<string, string> = model.provider === 'openrouter'
          ? { 'HTTP-Referer': 'https://admin.automation-plus-ki.de', 'X-Title': 'AIOS Dashboard' }
          : {};

        if (!apiKey) {
          const providerName = model.provider === 'google' ? 'Google AI Studio' : 'OpenRouter';
          send(`❌ ${providerName} API Key nicht konfiguriert.`);
          controller.close();
          return;
        }

        const chatMessages: Array<{ role: string; content: string }> = [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ];

        // Agentic loop (max 5 rounds)
        for (let round = 0; round < 5; round++) {
          const resp = await callOpenAICompat({
            baseUrl, apiKey, model: model.id,
            messages: chatMessages,
            useTools: model.tools,
            extraHeaders,
          });

          if (!resp.ok || !resp.body) {
            const errText = await resp.text().catch(() => String(resp.status));
            send(`❌ API Fehler (${resp.status}): ${errText.slice(0, 200)}`);
            break;
          }

          const reader = resp.body.getReader();
          const dec = new TextDecoder();
          let buffer = '';
          let assistantContent = '';
          const toolCalls: Record<string, { name: string; args: string }> = {};
          let finishReason = '';

          // Parse SSE stream
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += dec.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();
              if (data === '[DONE]') { finishReason = finishReason || 'stop'; continue; }
              try {
                const chunk = JSON.parse(data);
                const delta = chunk.choices?.[0]?.delta;
                const fr = chunk.choices?.[0]?.finish_reason;
                if (fr) finishReason = fr;

                if (delta?.content) {
                  send(delta.content);
                  assistantContent += delta.content;
                }

                // Collect tool call chunks
                if (delta?.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const idx = String(tc.index ?? 0);
                    if (!toolCalls[idx]) toolCalls[idx] = { name: '', args: '' };
                    if (tc.function?.name) toolCalls[idx].name += tc.function.name;
                    if (tc.function?.arguments) toolCalls[idx].args += tc.function.arguments;
                  }
                }
              } catch { /* ignore parse errors */ }
            }
          }

          const hasCalls = Object.keys(toolCalls).length > 0;
          if (!hasCalls || finishReason === 'stop') break;

          // Execute tools and continue loop
          chatMessages.push({ role: 'assistant', content: assistantContent || '' });

          const toolResults: Array<{ role: string; content: string; tool_call_id?: string; name?: string }> = [];
          for (const [, tc] of Object.entries(toolCalls)) {
            let args: Record<string, unknown> = {};
            try { args = JSON.parse(tc.args || '{}'); } catch { /* ignore */ }
            sendTool(`🔧 ${tc.name}…`);
            const result = await executeTool(tc.name, args);
            toolResults.push({ role: 'tool', content: result, name: tc.name });
          }
          chatMessages.push(...toolResults);
        }

        controller.close();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: `❌ Fehler: ${msg}` })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
