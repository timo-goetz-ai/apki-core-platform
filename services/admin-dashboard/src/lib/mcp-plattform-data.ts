// MCP-Plattform — Typen & In-Memory Store
// Echtzeit-Abbild der realen Multi-Projekt-Infrastruktur auf automation-plus-ki.de

export type ProjektStatus = "online" | "degraded" | "offline";

export interface Projekt {
  id: string;
  name: string;
  emoji: string;
  beschreibung: string;
  url: string;
  status: ProjektStatus;
  mcpServer: string[];          // zugeordnete MCP-Server-IDs
  owner?: string;
  uptime_pct: number;
  requests_heute: number;
  fehler_heute: number;
}

export interface MCPDienst {
  id: string;
  name: string;               // z.B. "MCP GitHub"
  funktion: string;           // z.B. "Versionskontrolle"
  dienstEmoji: string;
  projekt: string;            // Projekt-ID
  status: "aktiv" | "onboarding" | "inaktiv";
  seit: string;
  zuverlaessigkeit: number;   // 0–7 (entspricht hallucLevel)
  healthScore: number;        // 0–100
  lastCheck: string;
  url?: string;               // Service-URL
}

export interface AuditEintrag {
  id: string;
  ts: string;
  aktion: string;
  akteur: string;
  ressource: string;
  ergebnis: "OK" | "WARN" | "FEHLER";
  details?: string;
}

// ── Seed-Daten — Reale Projekte ──────────────────────────────────────────────

export const PROJEKTE_SEED: Projekt[] = [
  {
    id: "ai-agent-platform",
    name: "AI Agent Platform",
    emoji: "🤖",
    beschreibung: "Next.js Frontend + FastAPI Backend · Multi-Agent-Orchestrierung & Crew-Management",
    url: "https://agents.automation-plus-ki.de",
    status: "online",
    mcpServer: ["mcp-github", "mcp-postgres", "mcp-qdrant", "mcp-coolify", "mcp-n8n", "mcp-filesystem"],
    owner: "Timo Götz",
    uptime_pct: 99.4,
    requests_heute: 312,
    fehler_heute: 2,
  },
  {
    id: "ai-voice-platform",
    name: "AI Voice Platform",
    emoji: "🎙️",
    beschreibung: "Echtzeit-Voice-AI · STT/TTS-Pipeline · Google AI Integration",
    url: "https://voice.automation-plus-ki.de",
    status: "online",
    mcpServer: ["mcp-google", "mcp-filesystem", "mcp-postgres"],
    owner: "Timo Götz",
    uptime_pct: 98.7,
    requests_heute: 88,
    fehler_heute: 1,
  },
  {
    id: "infrastruktur",
    name: "Infrastruktur",
    emoji: "🏗️",
    beschreibung: "Hetzner 46.224.145.109 · Coolify · Authentik SSO · Grafana/Prometheus Monitoring",
    url: "https://coolify.automation-plus-ki.de",
    status: "online",
    mcpServer: ["mcp-hetzner", "mcp-authentik", "mcp-grafana", "mcp-prometheus", "mcp-nocodb", "mcp-cloudflare", "mcp-nextcloud", "mcp-vaultwarden"],
    owner: "Timo Götz",
    uptime_pct: 99.9,
    requests_heute: 541,
    fehler_heute: 0,
  },
];

// ── Seed-Daten — Reale MCP-Dienste ──────────────────────────────────────────

export const MCP_DIENSTE_SEED: MCPDienst[] = [
  {
    id: "mcp-github",
    name: "MCP GitHub",
    funktion: "Versionskontrolle",
    dienstEmoji: "🐙",
    projekt: "ai-agent-platform",
    status: "aktiv",
    seit: "2025-09-01",
    zuverlaessigkeit: 7,
    healthScore: 99,
    lastCheck: "2026-03-15",
    url: "https://mcp-github.automation-plus-ki.de",
  },
  {
    id: "mcp-postgres",
    name: "MCP Postgres",
    funktion: "Relationale Datenbank",
    dienstEmoji: "🐘",
    projekt: "ai-agent-platform",
    status: "aktiv",
    seit: "2025-09-01",
    zuverlaessigkeit: 7,
    healthScore: 98,
    lastCheck: "2026-03-15",
    url: "https://mcp-postgres.automation-plus-ki.de",
  },
  {
    id: "mcp-qdrant",
    name: "MCP Qdrant",
    funktion: "Vector-Datenbank",
    dienstEmoji: "🔮",
    projekt: "ai-agent-platform",
    status: "aktiv",
    seit: "2025-10-01",
    zuverlaessigkeit: 6,
    healthScore: 97,
    lastCheck: "2026-03-15",
    url: "https://mcp-qdrant.automation-plus-ki.de",
  },
  {
    id: "mcp-filesystem",
    name: "MCP Filesystem",
    funktion: "Lokaler Dateizugriff (Mac)",
    dienstEmoji: "📁",
    projekt: "ai-agent-platform",
    status: "aktiv",
    seit: "2025-11-01",
    zuverlaessigkeit: 5,
    healthScore: 94,
    lastCheck: "2026-03-15",
    url: "https://mcp-filesystem.automation-plus-ki.de",
  },
  {
    id: "mcp-google",
    name: "MCP Google",
    funktion: "KI & Search API",
    dienstEmoji: "🔍",
    projekt: "ai-voice-platform",
    status: "aktiv",
    seit: "2025-12-01",
    zuverlaessigkeit: 6,
    healthScore: 96,
    lastCheck: "2026-03-15",
    url: "https://mcp-google.automation-plus-ki.de",
  },
  {
    id: "mcp-coolify",
    name: "MCP Coolify",
    funktion: "Container-Deployment",
    dienstEmoji: "🚀",
    projekt: "infrastruktur",
    status: "aktiv",
    seit: "2025-08-01",
    zuverlaessigkeit: 7,
    healthScore: 99,
    lastCheck: "2026-03-15",
    url: "https://mcp-coolify.automation-plus-ki.de",
  },
  {
    id: "mcp-hetzner",
    name: "MCP Hetzner",
    funktion: "Server-Management",
    dienstEmoji: "🖥️",
    projekt: "infrastruktur",
    status: "aktiv",
    seit: "2025-08-01",
    zuverlaessigkeit: 7,
    healthScore: 100,
    lastCheck: "2026-03-15",
    url: "https://mcp-hetzner.automation-plus-ki.de",
  },
  {
    id: "mcp-authentik",
    name: "MCP Authentik",
    funktion: "SSO / Identity Management",
    dienstEmoji: "🔐",
    projekt: "infrastruktur",
    status: "aktiv",
    seit: "2025-09-15",
    zuverlaessigkeit: 7,
    healthScore: 99,
    lastCheck: "2026-03-15",
    url: "https://mcp-authentik.automation-plus-ki.de",
  },
  {
    id: "mcp-grafana",
    name: "MCP Grafana",
    funktion: "Observability & Dashboards",
    dienstEmoji: "📊",
    projekt: "infrastruktur",
    status: "aktiv",
    seit: "2025-08-15",
    zuverlaessigkeit: 6,
    healthScore: 97,
    lastCheck: "2026-03-15",
    url: "https://mcp-grafana.automation-plus-ki.de",
  },
  {
    id: "mcp-prometheus",
    name: "MCP Prometheus",
    funktion: "Metriken & Alerting",
    dienstEmoji: "🔥",
    projekt: "infrastruktur",
    status: "aktiv",
    seit: "2025-08-15",
    zuverlaessigkeit: 6,
    healthScore: 96,
    lastCheck: "2026-03-15",
    url: "https://mcp-prometheus.automation-plus-ki.de",
  },
  {
    id: "mcp-n8n",
    name: "MCP n8n",
    funktion: "Workflow-Automation",
    dienstEmoji: "⚡",
    projekt: "infrastruktur",
    status: "aktiv",
    seit: "2025-09-01",
    zuverlaessigkeit: 6,
    healthScore: 95,
    lastCheck: "2026-03-15",
    url: "https://mcp-n8n.automation-plus-ki.de",
  },
  {
    id: "mcp-cloudflare",
    name: "MCP Cloudflare",
    funktion: "DNS & CDN",
    dienstEmoji: "☁️",
    projekt: "infrastruktur",
    status: "aktiv",
    seit: "2025-08-01",
    zuverlaessigkeit: 7,
    healthScore: 100,
    lastCheck: "2026-03-15",
    url: "https://mcp-cloudflare.automation-plus-ki.de",
  },
  {
    id: "mcp-nocodb",
    name: "MCP NocoDB",
    funktion: "No-Code Datenbank",
    dienstEmoji: "🗃️",
    projekt: "infrastruktur",
    status: "aktiv",
    seit: "2025-10-01",
    zuverlaessigkeit: 5,
    healthScore: 93,
    lastCheck: "2026-03-15",
    url: "https://mcp-nocodb.automation-plus-ki.de",
  },
  {
    id: "mcp-nextcloud",
    name: "MCP Nextcloud",
    funktion: "Dateispeicher & Kollaboration",
    dienstEmoji: "☁️",
    projekt: "infrastruktur",
    status: "onboarding",
    seit: "2026-02-01",
    zuverlaessigkeit: 2,
    healthScore: 41,
    lastCheck: "2026-03-15",
    url: "https://mcp-nextcloud.automation-plus-ki.de",
  },
  {
    id: "mcp-vaultwarden",
    name: "MCP Vaultwarden",
    funktion: "Secrets & Passwort-Management",
    dienstEmoji: "🔑",
    projekt: "infrastruktur",
    status: "onboarding",
    seit: "2026-02-15",
    zuverlaessigkeit: 2,
    healthScore: 38,
    lastCheck: "2026-03-15",
    url: "https://mcp-vaultwarden.automation-plus-ki.de",
  },
];

export const AUDIT_SEED: AuditEintrag[] = [
  {
    id: "a001",
    ts: "2026-03-15T09:45:00Z",
    aktion: "deploy_service",
    akteur: "Timo Götz",
    ressource: "ai-agent-platform/coolify",
    ergebnis: "OK",
    details: "AI Agent Platform v2.3.1 deployed via Coolify",
  },
  {
    id: "a002",
    ts: "2026-03-15T08:30:00Z",
    aktion: "health_check",
    akteur: "system",
    ressource: "mcp-nextcloud.automation-plus-ki.de",
    ergebnis: "WARN",
    details: "Healthcheck fehlgeschlagen – Container unhealthy",
  },
  {
    id: "a003",
    ts: "2026-03-15T07:15:00Z",
    aktion: "permission_grant",
    akteur: "Timo Götz",
    ressource: "authentik/agents.automation-plus-ki.de",
    ergebnis: "OK",
    details: "Authentik SSO-Provider für AI Agent Platform konfiguriert",
  },
  {
    id: "a004",
    ts: "2026-03-14T18:20:00Z",
    aktion: "config_change",
    akteur: "Timo Götz",
    ressource: "mcp-postgres/connection-string",
    ergebnis: "OK",
    details: "Verbindungsstring auf Hetzner-IP 46.224.145.109 aktualisiert",
  },
  {
    id: "a005",
    ts: "2026-03-14T16:00:00Z",
    aktion: "service_onboard",
    akteur: "Timo Götz",
    ressource: "mcp-vaultwarden",
    ergebnis: "WARN",
    details: "MCP Vaultwarden in Betrieb genommen – Healthcheck ausstehend",
  },
];

// ── In-Memory Store ─────────────────────────────────────────────────────────

let _projekte: Projekt[] = [...PROJEKTE_SEED];
let _dienste: MCPDienst[] = [...MCP_DIENSTE_SEED];
let _audit: AuditEintrag[] = [...AUDIT_SEED];

export const store = {
  getProjekte: () => _projekte,
  getMCPDienste: () => _dienste,
  getAudit: () => [..._audit].sort((a, b) => b.ts.localeCompare(a.ts)),

  addMCPDienst: (d: MCPDienst) => {
    _dienste = [..._dienste, d];
    _audit = [
      {
        id: `a${Date.now()}`,
        ts: new Date().toISOString(),
        aktion: "service_onboard",
        akteur: "dashboard",
        ressource: `mcp-dienst/${d.id}`,
        ergebnis: "OK",
        details: `${d.dienstEmoji} ${d.name} — ${d.funktion}`,
      },
      ..._audit,
    ];
  },

  updateProjektStatus: (id: string, status: ProjektStatus) => {
    _projekte = _projekte.map((p) => (p.id === id ? { ...p, status } : p));
  },

  logAudit: (eintrag: Omit<AuditEintrag, "id" | "ts">) => {
    _audit = [
      { id: `a${Date.now()}`, ts: new Date().toISOString(), ...eintrag },
      ..._audit,
    ];
  },
};
