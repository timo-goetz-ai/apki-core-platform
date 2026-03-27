// ─────────────────────────────────────────────────────────────────────────────
// src/lib/services.config.ts
// Single source of truth for all monitored services.
// Health check types:
//   http  → GET request, success = 2xx
//   json  → GET request, parse JSON, check field
// ─────────────────────────────────────────────────────────────────────────────

export type ServiceCategory =
  | "automation"
  | "data"
  | "auth"
  | "monitoring"
  | "storage"
  | "ai"
  | "home";

export type HealthCheckType = "http" | "json";

export interface ServiceConfig {
  id: string;
  name: string;
  category: ServiceCategory;
  url: string; // public URL for link
  healthEndpoint: string; // internal URL proxied server-side
  healthType: HealthCheckType;
  healthJsonPath?: string;
  healthJsonExpect?: string;
  description: string;
  icon: string; // lucide icon name
  proxyKey: string; // used in /api/proxy/[service]
  metrics?: {
    endpoint: string;
    label: string;
    jsonPath: string;
    unit?: string;
  }[];
}

export const SERVICES: ServiceConfig[] = [
  // ── AI / MCP ─────────────────────────────────────────────────────────────────
  {
    id: "mcp-hub",
    name: "MCP Hub",
    category: "ai",
    url: process.env.MCP_HUB_URL || "https://mcp.automation-plus-ki.de",
    healthEndpoint: `${process.env.MCP_HUB_INTERNAL_URL || "https://mcp.automation-plus-ki.de"}/health`,
    healthType: "http",
    description: "18 MCP Server Layer",
    icon: "BrainCircuit",
    proxyKey: "mcp-hub",
  },

  // ── Automation ──────────────────────────────────────────────────────────────
  {
    id: "n8n",
    name: "n8n",
    category: "automation",
    url: "https://n8n.automation-plus-ki.de",
    healthEndpoint: process.env.N8N_INTERNAL_URL
      ? `${process.env.N8N_INTERNAL_URL}/healthz`
      : "https://n8n.automation-plus-ki.de/healthz",
    healthType: "json",
    healthJsonPath: "status",
    healthJsonExpect: "ok",
    description: "Workflow Automation Engine",
    icon: "Workflow",
    proxyKey: "n8n",
    metrics: [
      {
        endpoint: "/api/v1/workflows?limit=1",
        label: "Workflows",
        jsonPath: "count",
      },
    ],
  },

  // ── Data ────────────────────────────────────────────────────────────────────
  {
    id: "nocodb",
    name: "NocoDB",
    category: "data",
    url: process.env.NOCODB_URL || "https://nocodb.automation-plus-ki.de",
    healthEndpoint: `${process.env.NOCODB_INTERNAL_URL || "https://nocodb.automation-plus-ki.de"}/api/v1/health`,
    healthType: "json",
    healthJsonPath: "message",
    healthJsonExpect: "OK",
    description: "No-Code Database Platform",
    icon: "Database",
    proxyKey: "nocodb",
  },

  // ── Monitoring ───────────────────────────────────────────────────────────────
  {
    id: "grafana",
    name: "Grafana",
    category: "monitoring",
    url: process.env.GRAFANA_URL || "https://grafana.automation-plus-ki.de",
    healthEndpoint: `${process.env.GRAFANA_INTERNAL_URL || "https://grafana.automation-plus-ki.de"}/api/health`,
    healthType: "json",
    healthJsonPath: "database",
    healthJsonExpect: "ok",
    description: "Observability & Dashboards",
    icon: "BarChart3",
    proxyKey: "grafana",
  },
  {
    id: "prometheus",
    name: "Prometheus",
    category: "monitoring",
    url: process.env.PROMETHEUS_URL || "https://prometheus.automation-plus-ki.de",
    healthEndpoint: `${process.env.PROMETHEUS_INTERNAL_URL || "https://prometheus.automation-plus-ki.de"}/-/healthy`,
    healthType: "http",
    description: "Metrics Collection",
    icon: "Activity",
    proxyKey: "prometheus",
  },

  // ── Auth ────────────────────────────────────────────────────────────────────
  {
    id: "authentik",
    name: "Authentik",
    category: "auth",
    url: process.env.AUTHENTIK_URL || "https://auth.automation-plus-ki.de",
    healthEndpoint: `${process.env.AUTHENTIK_INTERNAL_URL || "https://auth.automation-plus-ki.de"}/-/health/ready/`,
    healthType: "http",
    description: "Identity Provider & SSO",
    icon: "ShieldCheck",
    proxyKey: "authentik",
  },

  // ── Storage ──────────────────────────────────────────────────────────────────
  {
    id: "hetzner-storage",
    name: "Hetzner Storage",
    category: "storage",
    // Hetzner Object Storage S3 — root returns 403 when reachable (expected, treated as online)
    url: process.env.HETZNER_STORAGE_URL || "https://fsn1.your-objectstorage.com",
    healthEndpoint:
      process.env.HETZNER_STORAGE_INTERNAL_URL ||
      "https://fsn1.your-objectstorage.com",
    healthType: "http",
    description: "Hetzner Object Storage (S3)",
    icon: "HardDrive",
    proxyKey: "hetzner-storage",
  },

  // ── Home ─────────────────────────────────────────────────────────────────────
  {
    id: "homeassistant",
    name: "Home Assistant",
    category: "home",
    url: process.env.HA_URL || "https://ha.automation-plus-ki.de",
    healthEndpoint: `${process.env.HA_INTERNAL_URL || "https://ha.automation-plus-ki.de"}/api/`,
    healthType: "json",
    healthJsonPath: "message",
    healthJsonExpect: "API running.",
    description: "Smart Home Orchestration",
    icon: "Home",
    proxyKey: "homeassistant",
  },
];

export const SERVICE_MAP = Object.fromEntries(
  SERVICES.map((s) => [s.proxyKey, s])
) as Record<string, ServiceConfig>;

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  automation: "Automation",
  data: "Data",
  auth: "Auth & SSO",
  monitoring: "Monitoring",
  storage: "Storage",
  ai: "AI / MCP",
  home: "Smart Home",
};

export const CATEGORY_ORDER: ServiceCategory[] = [
  "ai",
  "automation",
  "data",
  "monitoring",
  "auth",
  "storage",
  "home",
];
