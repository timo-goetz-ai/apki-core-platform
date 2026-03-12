"use client";

const BASE_DOMAIN =
  process.env.NEXT_PUBLIC_BASE_DOMAIN || "automation-plus-ki.de";

const SERVICES = [
  { id: "n8n", label: "n8n", url: `https://n8n.${BASE_DOMAIN}`, icon: "⚡" },
  {
    id: "nocodb",
    label: "NocoDB",
    url: `https://nocodb.${BASE_DOMAIN}`,
    icon: "📊",
  },
  {
    id: "grafana",
    label: "Grafana",
    url: `https://grafana.${BASE_DOMAIN}`,
    icon: "📈",
  },
  {
    id: "voice",
    label: "Voice AI",
    url: `https://voice.${BASE_DOMAIN}`,
    icon: "🎙️",
  },
  {
    id: "agents",
    label: "Agents",
    url: `https://agents.${BASE_DOMAIN}`,
    icon: "🤖",
  },
  {
    id: "mailpit",
    label: "Mailpit",
    url: `https://mail.${BASE_DOMAIN}`,
    icon: "📧",
  },
  {
    id: "appflowy",
    label: "AppFlowy",
    url: `https://appflowy.${BASE_DOMAIN}`,
    icon: "📝",
  },
  {
    id: "hetzner",
    label: "Hetzner S3",
    url: "https://console.hetzner.cloud/",
    icon: "☁️",
  },
  {
    id: "mcp",
    label: "MCP Server",
    url: `https://agents.${BASE_DOMAIN}/mcp`,
    icon: "🔌",
  },
];

export function ServicesSidebar() {
  return (
    <aside className="w-56 shrink-0">
      <nav className="space-y-2">
        {SERVICES.map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <span className="mr-2">{s.icon}</span>
            {s.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
