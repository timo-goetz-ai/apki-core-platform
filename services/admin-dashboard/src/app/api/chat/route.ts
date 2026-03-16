import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? "";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_DOMAIN
  ? `https://admin.${process.env.NEXT_PUBLIC_BASE_DOMAIN}`
  : "http://localhost:3000";

// ── Tool definitions the LLM can call ────────────────────────────────────────
const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_service_health",
      description: "Gibt den Gesundheitsstatus aller 25+ laufenden Services zurück (online/offline/latenz).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_docker_containers",
      description: "Listet alle Docker-Container mit Name, Status und Image auf.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_coolify_services",
      description: "Listet alle Coolify-Applikationen und Services mit Status auf.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_cloudflare_zones",
      description: "Zeigt Cloudflare DNS-Zonen und deren Status.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_github_stats",
      description: "Gibt GitHub Repository-Statistiken zurück (Repos, Commits, Sprachen).",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_n8n_webhooks",
      description: "Listet konfigurierte n8n Webhooks auf.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "docker_action",
      description: "Startet, stoppt oder restartet einen Docker-Container.",
      parameters: {
        type: "object",
        required: ["container_id", "action"],
        properties: {
          container_id: { type: "string", description: "Container ID oder Name" },
          action: { type: "string", enum: ["start", "stop", "restart"] },
        },
      },
    },
  },
];

// ── Execute a tool call ───────────────────────────────────────────────────────
async function executeTool(name: string, args: Record<string, string>): Promise<string> {
  const apiKey = process.env.DASHBOARD_API_KEY ?? "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(apiKey ? { "x-api-key": apiKey } : {}),
  };
  const internalBase = process.env.NEXT_PUBLIC_BASE_URL ?? BASE_URL;

  try {
    switch (name) {
      case "get_service_health": {
        const r = await fetch(`${internalBase}/api/services`, { headers, signal: AbortSignal.timeout(10000) });
        const d = await r.json();
        const entries = Object.entries(d as Record<string, { status: string; latency?: number }>);
        const online = entries.filter(([, v]) => v.status === "online").length;
        const summary = entries.map(([k, v]) => `${k}: ${v.status}${v.latency ? ` (${v.latency}ms)` : ""}`).join("\n");
        return `${online}/${entries.length} Services online:\n\n${summary}`;
      }
      case "list_docker_containers": {
        const r = await fetch(`${internalBase}/api/docker/containers`, { headers, signal: AbortSignal.timeout(8000) });
        const d = await r.json() as { containers: Array<{ Names: string[]; Status: string; Image: string; State: string }> };
        const list = (d.containers ?? []).slice(0, 30).map(c =>
          `${c.Names?.[0]?.replace("/","") ?? "?"} — ${c.State} — ${c.Image?.split(":")[0]}`
        ).join("\n");
        return `${(d.containers ?? []).length} Container gesamt:\n\n${list}`;
      }
      case "get_coolify_services": {
        const r = await fetch(`${internalBase}/api/coolify/services`, { headers, signal: AbortSignal.timeout(8000) });
        const d = await r.json() as { services: Array<{ name: string; status: string; kind: string; fqdn?: string }> };
        const list = (d.services ?? []).map(s =>
          `${s.name} [${s.kind}] — ${s.status}${s.fqdn ? ` → ${s.fqdn}` : ""}`
        ).join("\n");
        return `${(d.services ?? []).length} Coolify Apps:\n\n${list}`;
      }
      case "get_cloudflare_zones": {
        const r = await fetch(`${internalBase}/api/cloudflare/zones`, { headers, signal: AbortSignal.timeout(8000) });
        const d = await r.json() as { zones: Array<{ name: string; status: string; plan: string }> };
        const list = (d.zones ?? []).map(z => `${z.name} — ${z.status} (${z.plan})`).join("\n");
        return `Cloudflare Zonen:\n\n${list}`;
      }
      case "get_github_stats": {
        const r = await fetch(`${internalBase}/api/github/stats`, { headers, signal: AbortSignal.timeout(8000) });
        const d = await r.json() as { stats: Record<string, unknown> };
        return `GitHub Stats:\n${JSON.stringify(d.stats, null, 2)}`;
      }
      case "get_n8n_webhooks": {
        const r = await fetch(`${internalBase}/api/n8n/webhooks`, { headers, signal: AbortSignal.timeout(5000) });
        const d = await r.json() as { webhooks: Array<{ name: string; configured: boolean }> };
        const list = (d.webhooks ?? []).map(w => `${w.name} — ${w.configured ? "✓ konfiguriert" : "nicht konfiguriert"}`).join("\n");
        return `n8n Webhooks:\n${list || "Keine Webhooks konfiguriert"}`;
      }
      case "docker_action": {
        const r = await fetch(`${internalBase}/api/docker/containers/${args.container_id}/${args.action}`, {
          method: "POST", headers, signal: AbortSignal.timeout(12000),
        });
        const d = await r.json() as { ok: boolean; status: number };
        return d.ok
          ? `✓ Container ${args.container_id} wurde ${args.action === "start" ? "gestartet" : args.action === "stop" ? "gestoppt" : "neugestartet"}.`
          : `Fehler beim ${args.action}: HTTP ${d.status}`;
      }
      default:
        return `Unbekanntes Tool: ${name}`;
    }
  } catch (e) {
    return `Fehler: ${String(e)}`;
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Du bist der KI-Assistent des Admin-Dashboards von Timo Götz (automation-plus-ki.de).

Du hast direkten Zugriff auf folgende Tools und kannst sie nutzen:
- Service-Health (25+ Services auf Hetzner CPX42)
- Docker Container (65+ Container)
- Coolify Apps (17 verwaltete Applikationen)
- Cloudflare DNS & Zones
- GitHub Repository-Stats
- n8n Workflow-Webhooks
- Docker Container starten/stoppen/restarten

Infrastruktur:
- Server: Hetzner CPX42, Nürnberg, 46.224.145.109
- Domain: automation-plus-ki.de (Cloudflare-Proxy)
- Stack: Traefik, Coolify, Docker, n8n, NocoDB, Grafana, Prometheus, AppFlowy, Authentik

Verhalte dich proaktiv: Wenn der Nutzer nach dem Status fragt, ruf direkt das Tool auf.
Antworte präzise und auf Deutsch. Bei Aktionen (Container stoppen etc.) frag kurz nach Bestätigung.
Fasse Ergebnisse klar zusammen, verwende Emojis sparsam für Übersicht.`;

// ── POST /api/chat ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (!OPENROUTER_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENROUTER_API_KEY nicht gesetzt" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages } = await req.json() as {
    messages: Array<{ role: string; content: string }>;
  };

  // Agentic loop: up to 5 tool-call rounds
  const history = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages,
  ];

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (chunk: string) => controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));

      try {
        for (let round = 0; round < 5; round++) {
          const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENROUTER_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://admin.automation-plus-ki.de",
              "X-Title": "AIOS Admin Dashboard",
            },
            body: JSON.stringify({
              model: "anthropic/claude-3.5-sonnet",
              messages: history,
              tools: TOOLS,
              tool_choice: "auto",
              max_tokens: 2048,
              stream: false,
            }),
            signal: AbortSignal.timeout(30000),
          });

          if (!res.ok) {
            send(`\n[Fehler: OpenRouter ${res.status}]`);
            break;
          }

          const data = await res.json() as {
            choices: Array<{
              finish_reason: string;
              message: {
                role: string;
                content: string | null;
                tool_calls?: Array<{
                  id: string;
                  function: { name: string; arguments: string };
                }>;
              };
            }>;
          };

          const choice = data.choices?.[0];
          if (!choice) break;

          const msg = choice.message;

          // Stream text content
          if (msg.content) {
            send(msg.content);
          }

          // Handle tool calls
          if (choice.finish_reason === "tool_calls" && msg.tool_calls?.length) {
            history.push({ role: "assistant", content: JSON.stringify(msg) });

            for (const tc of msg.tool_calls) {
              send(`\n\n🔧 *${tc.function.name}*…\n`);
              const args = JSON.parse(tc.function.arguments || "{}") as Record<string, string>;
              const result = await executeTool(tc.function.name, args);
              send(result);
              history.push({
                role: "tool",
                content: JSON.stringify({ tool_call_id: tc.id, content: result }),
              });
            }
            // Continue loop for follow-up response
            continue;
          }

          break; // done
        }
      } catch (e) {
        send(`\n[Fehler: ${String(e)}]`);
      }

      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
