export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { MODELS, DEFAULT_MODEL, ORCHESTRATOR_AUTO, resolveOrchestratorModel } from '@/lib/chat-models';

const ANYTHINGLLM_URL = process.env.ANYTHINGLLM_URL ?? 'http://localhost:3003';
const ANYTHINGLLM_KEY = process.env.ANYTHINGLLM_API_KEY ?? '';
const NOCODB_URL      = process.env.NOCODB_URL ?? 'https://nocodb.automation-plus-ki.de';
const NOCODB_TOKEN    = process.env.NOCODB_API_TOKEN ?? '';
const NOCODB_BASE     = process.env.NOCODB_AI_SYSTEM_BASE_ID ?? '';
const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY ?? '';
const GOOGLE_KEY     = process.env.GOOGLE_AI_API_KEY ?? '';
const N8N_URL        = process.env.N8N_BASE_URL ?? 'https://n8n.automation-plus-ki.de';
const N8N_KEY        = process.env.N8N_API_KEY ?? '';
const COOLIFY_URL    = process.env.COOLIFY_URL ?? 'https://coolify.automation-plus-ki.de';
const COOLIFY_KEY    = process.env.COOLIFY_API_KEY ?? '';
const CF_TOKEN       = process.env.CLOUDFLARE_API_TOKEN ?? '';

// ─── Model note: Claude Haiku (anthropic/claude-haiku-*) is recommended for tool-use tasks
//     due to fast latency and strong function-calling reliability. ─────────────
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
  {
    type: 'function',
    function: {
      name: 'query_knowledge_base',
      description: 'Query the NocoDB Knowledge Base. Can retrieve rules, skills, agents, subagents, plugins, hooks, or prompts from the AI_SYSTEM database.',
      parameters: {
        type: 'object',
        properties: {
          table: {
            type: 'string',
            enum: ['rules', 'skills', 'plugins', 'hooks', 'agents', 'subagents', 'prompts', 'knowledge_items'],
            description: 'Which table to query',
          },
          filter: {
            type: 'string',
            description: 'Optional text filter for the Name/Titel column',
          },
        },
        required: ['table'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'trigger_workflow',
      description: 'Trigger an n8n workflow via webhook. Use this when the user wants to start a workflow, create content, process a topic, run a pipeline, or send something to n8n.',
      parameters: {
        type: 'object',
        properties: {
          workflow: {
            type: 'string',
            enum: ['content-pipeline', 'voice-tts', 'content-enrichment', 'apply-template', 'nische-aktiviert', 'lead-capture', 'wf1-test-run'],
            description: 'Which webhook to trigger'
          },
          payload: {
            type: 'object',
            description: 'JSON payload to send. For content-pipeline: {thema: string}. For voice-tts: {text: string}. For content-enrichment: {content: string}. For apply-template: {content: string, template: string}. For nische-aktiviert: {nische: string}.'
          }
        },
        required: ['workflow', 'payload']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_workflow_status',
      description: 'Get the list of all n8n workflows with their status (active/inactive), trigger type, and last execution info.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_telegram',
      description: 'Send a Telegram message to the admin (Timo). Use when the user wants to send themselves a note, reminder, or result.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The message text to send' }
        },
        required: ['message']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'deep_research',
      description: 'Perform deep research on a topic by querying multiple sources: HackerNews, Reddit, GitHub trending, and NocoDB knowledge base. Returns a structured research report.',
      parameters: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'The topic to research' },
          depth: { type: 'string', enum: ['quick', 'deep'], description: 'quick = top results only, deep = full analysis with synthesis' }
        },
        required: ['topic']
      }
    }
  }
];

const SYSTEM_PROMPT = `Du bist AIOS — der KI-Assistent für die Infrastruktur von automation-plus-ki.de.

Server: Hetzner CPX42 (<HETZNER_HOST>), Ubuntu 22.04, 8 vCPU, 16GB RAM
Stack: Docker + Coolify, Traefik reverse proxy

Dienste:
- n8n (Workflows): https://n8n.automation-plus-ki.de
- NocoDB (Datenbank): https://nocodb.automation-plus-ki.de
- Grafana (Monitoring): https://grafana.automation-plus-ki.de
- Prometheus: https://prometheus.automation-plus-ki.de
- Qdrant (Vektoren): https://qdrant.automation-plus-ki.de
- Coolify (Deployment): https://coolify.automation-plus-ki.de
- Steel Browser (Scraping): eigener Service
- Vaultwarden (Passwörter): eigener Service
- Mailpit (Mail): eigener Service
- Redis, PostgreSQL: interne Services
- 19 MCP Server: mcp-*.automation-plus-ki.de

Admin Dashboard: https://admin.automation-plus-ki.de

Du hast Zugriff auf Tools um Container zu steuern, Services zu prüfen und Infos abzurufen.
Du kannst n8n-Workflows direkt starten (trigger_workflow), alle Workflows auflisten (get_workflow_status), Telegram-Nachrichten senden (send_telegram) und Deep Research zu beliebigen Themen machen (deep_research). Nutze diese Tools proaktiv wenn der User etwas starten oder recherchieren möchte. Beispiele: "Starte die Content Pipeline für KI-Agenten" → trigger_workflow mit content-pipeline, "Was läuft in n8n?" → get_workflow_status, "Schick mir eine Zusammenfassung" → send_telegram, "Recherchiere Llama 4 Trends" → deep_research.
Antworte präzise auf Deutsch. Nutze Markdown für strukturierte Ausgaben.`;

// ─── NocoDB Knowledge Base table IDs ─────────────────────────────────────────
const NOCO_TABLE_IDS: Record<string, string> = {
  skills:          'mdkwfxgjg80tgjd',
  rules:           'mcn1qpaapk5x849',
  hooks:           'mgnxselg5bkglr8',
  clients:         'mxfirejid6z3h5g',
  subagents:       'm6kwm1cedzeou6w',
  cursor_configs:  'mzzgzfzgatrauwy',
  plugins:         'mbt77n1toqpa094',
  agents:          'mjdp54ldeoxlb8s',
  prompts:         'mijlvsujsgqa92m',
  knowledge_items: 'm9hgs3y3iz9xtgl',
};

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
      case 'query_knowledge_base': {
        const table = args.table as string;
        const tableId = NOCO_TABLE_IDS[table];
        if (!tableId) return `Unknown table: ${table}`;
        const url = `${NOCODB_URL}/api/v1/db/data/noco/${NOCODB_BASE}/${tableId}?limit=50`;
        const r = await fetch(url, {
          headers: { 'xc-token': NOCODB_TOKEN },
          signal: AbortSignal.timeout(8000),
        });
        const data = await r.json();
        return JSON.stringify(data.list ?? data, null, 2);
      }
      case 'trigger_workflow': {
        const webhook = args.workflow as string;
        const payload = args.payload as Record<string, unknown>;
        const url = `https://n8n.automation-plus-ki.de/webhook/${webhook}`;
        try {
          const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15000),
          });
          if (r.ok) {
            const data = await r.json().catch(() => ({}));
            return `✅ Workflow "${webhook}" erfolgreich gestartet.\n\nPayload: ${JSON.stringify(payload)}\n\nAntwort: ${JSON.stringify(data).slice(0, 500)}`;
          }
          return `❌ Workflow "${webhook}" Fehler: HTTP ${r.status}`;
        } catch (e) {
          return `❌ Webhook nicht erreichbar: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
      case 'get_workflow_status': {
        try {
          const r = await fetch('https://n8n.automation-plus-ki.de/api/v1/workflows?limit=50', {
            headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY || '***REDACTED_N8N_KEY***' },
            signal: AbortSignal.timeout(8000),
          });
          const data = await r.json();
          const workflows = (data.data || []).map((w: { name: string; active: boolean; id: string }) => ({
            name: w.name,
            active: w.active,
            id: w.id,
          }));
          const active = workflows.filter((w: { active: boolean }) => w.active).length;
          return `📋 n8n Workflows: ${workflows.length} gesamt, ${active} aktiv\n\n${workflows.map((w: { active: boolean; name: string }) => `${w.active ? '🟢' : '⚫'} ${w.name}`).join('\n')}`;
        } catch (e) {
          return `Fehler beim Abrufen: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
      case 'send_telegram': {
        const message = args.message as string;
        const botToken = process.env.TELEGRAM_BOT_TOKEN || '';
        const chatId = '6495183720';
        if (!botToken) return '❌ TELEGRAM_BOT_TOKEN nicht konfiguriert';
        try {
          const r = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'Markdown' }),
            signal: AbortSignal.timeout(8000),
          });
          const data = await r.json();
          return data.ok ? `✅ Telegram-Nachricht gesendet: "${message.slice(0, 80)}..."` : `❌ Fehler: ${JSON.stringify(data)}`;
        } catch (e) {
          return `❌ Telegram Fehler: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
      case 'deep_research': {
        const topic = args.topic as string;
        const depth = (args.depth as string) || 'quick';
        const encoded = encodeURIComponent(topic);
        const results: string[] = [];

        // HackerNews
        try {
          const hn = await fetch(`https://hn.algolia.com/api/v1/search?query=${encoded}&tags=story&hitsPerPage=5`, { signal: AbortSignal.timeout(6000) });
          const hnData = await hn.json();
          const hits = (hnData.hits || []).slice(0, 5).map((h: { title: string; points: number; url?: string }) => `• ${h.title} (${h.points} pts)`).join('\n');
          if (hits) results.push(`**HackerNews:**\n${hits}`);
        } catch { results.push('HackerNews: nicht erreichbar'); }

        // Reddit
        try {
          const reddit = await fetch(`https://www.reddit.com/search.json?q=${encoded}&sort=top&t=week&limit=5`, {
            headers: { 'User-Agent': 'AIOS-Dashboard/1.0' },
            signal: AbortSignal.timeout(6000),
          });
          const rdData = await reddit.json();
          const posts = ((rdData.data?.children) || []).slice(0, 5).map((p: { data: { title: string; score: number; subreddit: string } }) => `• r/${p.data.subreddit}: ${p.data.title} (${p.data.score} 👍)`).join('\n');
          if (posts) results.push(`**Reddit (diese Woche):**\n${posts}`);
        } catch { results.push('Reddit: nicht erreichbar'); }

        // GitHub Trending (via NocoDB trends table as fallback)
        try {
          const noco = await fetch(
            `${NOCODB_URL}/api/v1/db/data/noco/${NOCODB_BASE}/trends?limit=5&sort=-CreatedAt`,
            { headers: { 'xc-token': NOCODB_TOKEN }, signal: AbortSignal.timeout(5000) }
          );
          const nocoData = await noco.json();
          const items = (nocoData.list || []).slice(0, 3).map((t: { Thema?: string; Name?: string; Beschreibung?: string }) => `• ${t.Thema ?? t.Name}: ${(t.Beschreibung ?? '').slice(0, 80)}`).join('\n');
          if (items) results.push(`**Interne Trends (NocoDB):**\n${items}`);
        } catch { /* silent */ }

        const report = results.join('\n\n');
        return `🔬 **Deep Research: "${topic}"** (${depth})\n\n${report}\n\n---\n*${results.length} Quellen abgefragt*`;
      }
      default:
        return `Unknown tool: ${name}`;
    }
  } catch (e) {
    return `Tool error: ${(e as Error).message}`;
  }
}

// ─── OpenAI-compatible call (AnythingLLM + Google AI Studio) ────────────────
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
    if (m.provider === 'anythingllm') isAvailable = !!ANYTHINGLLM_URL;
    else if (m.provider === 'anthropic') isAvailable = !!ANTHROPIC_KEY;
    else if (m.provider === 'google') isAvailable = !!GOOGLE_KEY;
    return { key, ...m, available: isAvailable };
  });
  const availableKeys = available.filter((a) => a.available).map((a) => a.key);
  return NextResponse.json({
    models: available,
    orchestratorAuto: ORCHESTRATOR_AUTO,
    availableForAuto: availableKeys,
  });
}

// ─── POST — chat ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { messages, modelKey } = await req.json();

  const lastUser = messages?.filter((m: { role: string }) => m.role === 'user').pop();
  const lastContent = typeof lastUser?.content === 'string' ? lastUser.content : '';

  const availableKeys = Object.entries(MODELS)
    .filter(([, m]) => {
      if (m.provider === 'anythingllm') return !!ANYTHINGLLM_URL;
      if (m.provider === 'anthropic') return !!ANTHROPIC_KEY;
      if (m.provider === 'google') return !!GOOGLE_KEY;
      return false;
    })
    .map(([k]) => k);

  const resolvedKey = resolveOrchestratorModel(modelKey ?? DEFAULT_MODEL, {
    lastUserMessage: lastContent,
    hasToolUse: undefined,
    availableModels: availableKeys,
  });
  const key = resolvedKey;
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

        // ── AnythingLLM / Google (OpenAI-compatible, with agentic loop) ──
        const baseUrl = model.provider === 'google'
          ? 'https://generativelanguage.googleapis.com/v1beta/openai'
          : `${ANYTHINGLLM_URL}/api/openai`;
        const apiKey = model.provider === 'google' ? GOOGLE_KEY : ANYTHINGLLM_KEY;
        const extraHeaders: Record<string, string> = {};

        if (model.provider === 'google' && !apiKey) {
          send(`❌ Google AI Studio API Key nicht konfiguriert.`);
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
