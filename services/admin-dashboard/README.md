<div align="center">

# Admin Dashboard — Core Platform

**Zentrales Operations-Hub für automation-plus-ki.de**

[![Build](https://img.shields.io/github/actions/workflow/status/timo-goetz-ai/apki-core-platform/deploy.yml?branch=main&label=Deploy)](https://github.com/timo-goetz-ai/apki-core-platform/actions)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Coolify](https://img.shields.io/badge/Hosting-Coolify%20%2F%20Hetzner-5C4EFF)](https://coolify.io)

**Live:** [admin.automation-plus-ki.de](https://admin.automation-plus-ki.de) &nbsp;|&nbsp; **Auth:** Authentik SSO

</div>

---

## Was ist das?

Das Admin Dashboard ist das operative Herzstück der Plattform — eine Next.js 14 App mit über 30 Seiten, 40+ API-Routen und Integrationen zu allen Infrastruktur-Services. Von hier aus werden KI-Agenten gesteuert, Workflows verwaltet, Container überwacht und Content produziert.

---

## Alle Seiten & Routen

| Route | Beschreibung |
|-------|-------------|
| `/` | Dashboard-Startseite — Service-Health, Metriken, Command Center |
| `/agents` | Multi-Agent-Orchestrierung |
| `/agents/live` | Live-Agenten-Daten (SSE-Stream) |
| `/fabrik` | Snapshot Engine + Vektor-Suche (Qdrant) |
| `/content-factory` | Content-Produktions-Pipeline |
| `/content-factory/produced` | Erzeugte Inhalte |
| `/monitoring` | Infrastruktur-Monitoring Hub |
| `/monitoring/alerts` | Alert-Rules (Prometheus) |
| `/monitoring/analytics` | Performance-Analytics |
| `/monitoring/containers` | Docker-Container-Status |
| `/monitoring/grafana` | Grafana-Dashboard-Embedding |
| `/monitoring/metrics` | Prometheus-Metriken |
| `/monitoring/voice` | Voice-AI-Monitoring |
| `/workflows` | Workflow-Management & Scheduling |
| `/workflows/schedule` | Zeitplan-Übersicht |
| `/kanban` | Aufgaben- & Projekt-Kanban |
| `/settings` | System-Konfiguration |
| `/activity` | Aktivitäts-Log & Audit-Timeline |
| `/agentic-os` | Agentic OS Konfiguration |
| `/api-explorer` | API-Playground / Sandbox |
| `/batch-production` | Batch-Content-Produktion |
| `/claude-workspace` | Claude AI Workspace |
| `/databases` | Datenbank-Übersicht |
| `/deployments` | Deployment-Tracking |
| `/jarvis` | Jarvis-Automation |
| `/knowledge` | Wissensbasis |
| `/logs` | Log-Streaming |
| `/mcp-plattform` | MCP-Platform-Verwaltung |
| `/mcp-stadt` | MCP-City (Bezirke, Mitarbeiter, Audit) |
| `/raycast-workspace` | Raycast-Integration |
| `/services` | Service-Registry |
| `/templates` | Prompt-Templates |
| `/tools` | Tool-Übersicht |
| `/voice` | Voice-AI Interface |

---

## API-Routen (src/app/api/)

### Agenten & Automation
| Endpoint | Methode(n) | Beschreibung |
|----------|-----------|-------------|
| `/api/actions` | GET, POST | Command/Action-Registry |
| `/api/agents` | GET, POST | Agent-Verwaltung |
| `/api/crews` | GET, POST | AI-Crew-Management |
| `/api/crews/[crewId]` | GET, PUT, DELETE | Einzelner Crew |
| `/api/crews/executions` | GET | Ausführungshistorie |
| `/api/crews/stream` | GET | SSE-Stream für Crew-Ausführung |
| `/api/jarvis/tasks` | GET, POST | Jarvis-Aufgaben |
| `/api/agentic-os` | GET, PUT | Agentic OS Config |

### Content & KI
| Endpoint | Beschreibung |
|----------|-------------|
| `/api/chat` | LLM-Chat-Interface |
| `/api/content-factory` | Content-Generierung |
| `/api/content-factory/batch` | Batch-Generierung |
| `/api/content-factory/generate` | Einzelgenerierung |
| `/api/content-factory/picsart` | Bildgenerierung (PicsArt) |
| `/api/content-factory/pipeline` | Pipeline-Steuerung |
| `/api/content-factory/voice` | Voice-Content |
| `/api/content-planning` | Content-Planung |
| `/api/content/produced` | Fertige Inhalte |
| `/api/corporate-prompts` | Corporate-Prompt-Verwaltung |
| `/api/templates` | Template-Engine |
| `/api/voice/assistant` | Voice-Assistant |
| `/api/voice/tts` | Text-to-Speech (Fish Audio) |

### Infrastruktur & Monitoring
| Endpoint | Beschreibung |
|----------|-------------|
| `/api/monitoring` | Monitoring-Daten |
| `/api/monitoring/alerts` | Prometheus-Alertregeln |
| `/api/monitoring/grafana` | Grafana-Integration |
| `/api/monitoring/metrics` | Metriken-Abfrage |
| `/api/monitoring/prometheus` | Prometheus-Proxy |
| `/api/monitoring/voice` | Voice-Monitoring |
| `/api/docker/containers` | Docker-Container-Status |
| `/api/coolify` | Coolify-Steuerung |
| `/api/coolify/deploy` | Deploy-Trigger |
| `/api/coolify/services` | Service-Liste |
| `/api/cloudflare/tunnels` | Cloudflare-Tunnels |
| `/api/cloudflare/zones` | Cloudflare-Zones |
| `/api/deployments` | Deployment-Übersicht |
| `/api/deployments/history` | Deployment-Verlauf |
| `/api/logs` | Log-Abfrage |
| `/api/logs/live` | Live-Log-Stream (SSE) |
| `/api/config-status` | Konfigurations-Gesundheit |

### Daten & Integrationen
| Endpoint | Beschreibung |
|----------|-------------|
| `/api/nocodb/agents` | NocoDB: Agenten-Tabelle |
| `/api/nocodb/projects` | NocoDB: Projekte |
| `/api/nocodb/resources` | NocoDB: Ressourcen |
| `/api/nocodb/error-logs` | NocoDB: Fehler-Logs |
| `/api/nocodb/table` | NocoDB: Generische Tabelle |
| `/api/n8n/live` | n8n: Live-Workflows |
| `/api/n8n/sync` | n8n: Workflow-Sync |
| `/api/n8n/trigger` | n8n: Workflow-Trigger |
| `/api/n8n/summary` | n8n: Workflow-Zusammenfassung |
| `/api/n8n/rename-bulk` | n8n: Bulk-Umbenennung |
| `/api/drive` | Google Drive |
| `/api/storage/s3` | S3-Storage-Browser |
| `/api/github/stats` | GitHub-Statistiken |
| `/api/postiz/posts` | Postiz Social Media |
| `/api/mailpit/stats` | Mailpit E-Mail-Testing |

### Fabrik (Vektor-Engine)
| Endpoint | Beschreibung |
|----------|-------------|
| `/api/fabrik/search` | Semantische Suche (Qdrant) |
| `/api/fabrik/index` | Dokumente indexieren |
| `/api/fabrik/hooks` | Fabrik-Webhooks |

### Platform & Meta
| Endpoint | Beschreibung |
|----------|-------------|
| `/api/activity` | Aktivitäts-Feed |
| `/api/activity/live` | Live-Aktivität (SSE) |
| `/api/services` | Service-Registry |
| `/api/services/refresh` | Service-Status neu laden |
| `/api/stats/overview` | Dashboard-Statistiken |
| `/api/stats/timeseries` | Zeitreihen-Daten |
| `/api/stats/heatmap` | Aktivitäts-Heatmap |
| `/api/stats/distribution` | Verteilungs-Diagramme |
| `/api/mcp-plattform/audit` | MCP-Audit-Log |
| `/api/mcp-plattform/dienste` | MCP-Dienste |
| `/api/mcp-plattform/projekte` | MCP-Projekte |
| `/api/mcp-stadt/audit` | MCP-City-Audit |
| `/api/mcp-stadt/bezirke` | MCP-City-Bezirke |
| `/api/mcp-stadt/mitarbeiter` | MCP-City-Mitarbeiter |
| `/api/scanner/run` | Scanner ausführen |
| `/api/scanner/github` | GitHub-Scanner |
| `/api/scanner/n8n` | n8n-Scanner |
| `/api/scanner/nocodb-schema` | NocoDB-Schema-Scanner |
| `/api/scanner/rss` | RSS-Scanner |
| `/api/timeline` | Audit-Timeline |
| `/api/costs` | Kosten-Tracking |
| `/api/mac/projects` | Mac-Projekte |
| `/api/mac/sync` | Mac-Sync |
| `/api/raycast/projects` | Raycast-Projekte |

---

## Externe Service-Verbindungen

```
┌─────────────────────────────────────────────────────┐
│                  Admin Dashboard                     │
│              admin.automation-plus-ki.de             │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┼──────────────────┐
        ▼              ▼                  ▼
   [NocoDB/Directus]  [Qdrant]      [n8n Workflows]
   Agenten, Prompts,  Vektor-DB,    Automation,
   Skills, Workflows  Fabrik-Suche  Trigger, Sync
        │              
        ├──────────────┬──────────────────┐
        ▼              ▼                  ▼
   [Prometheus]    [Grafana]        [Coolify]
   Metriken,       Dashboards,      Deploy-API,
   Alert-Rules     Embedding        Service-Mgmt
        │
        ├──────────────┬──────────────────┐
        ▼              ▼                  ▼
   [Docker API]   [Cloudflare]      [GitHub API]
   Container-Mgmt Tunnels, DNS,     Repo-Stats,
                  Zones             Webhooks
        │
        ├──────────────┬──────────────────┐
        ▼              ▼                  ▼
   [Fish Audio]  [Google APIs]    [Picsart API]
   TTS/Voice     Drive, Gemini,   Bildgenerierung
                 Embeddings
```

### Umgebungsvariablen

```env
# Daten-Layer
NOCODB_URL=https://nocodb.automation-plus-ki.de
NOCODB_API_TOKEN=

# Vektor-Datenbank
QDRANT_URL=https://qdrant.automation-plus-ki.de
QDRANT_API_KEY=
QDRANT_FABRIK_COLLECTION=aios_fabrik

# LLM & Embeddings
OPENROUTER_API_KEY=
GOOGLE_AI_API_KEY=
FABRIK_EMBED_MODEL=openai/text-embedding-3-small

# Backend API (nexus-core)
NEXT_PUBLIC_AIOS_CORE_API_URL=http://nexus-core:8000
NEXT_PUBLIC_WS_URL=ws://nexus-core:8000

# Auth
DASHBOARD_API_KEY=

# Webhooks
FABRIK_INTERNAL_WEBHOOK_TOKEN=
```

Secrets in **1Password** Vault `03_INFRA_HETZNER_SERV`, Tag `homestack`.

---

## Auth-Architektur

```
Browser → Traefik → Authentik Forward Auth → Admin Dashboard
                         │
                         └─ SSO: admin@timo-goetz-ai.de
                              (Session-Cookie)
                              
API-Routen: Bearer Token (DASHBOARD_API_KEY)
→ verifyApiKey(request) in src/lib/auth.ts
→ 401 bei Fehler
```

---

## Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Framework | Next.js 14 App Router |
| Styling | Tailwind CSS v3 + CSS Design Tokens |
| UI-Bibliothek | Radix UI + CVA (shadcn-Stil) |
| Charts | ECharts + echarts-for-react |
| Tabellen | TanStack Table v8 |
| Command Palette | cmdk |
| Icons | Lucide React |
| Animation | Framer Motion |
| Sprache | TypeScript 5 |

---

## Deployment

```
Push → main
  └→ GitHub Actions: Docker Build
       └→ Push → ghcr.io/timo-goetz-ai/nexus-admin-dashboard:latest
            └→ Coolify Webhook → Deploy
                 UUID: gsc8oscgw0kswsooc484swcw
```

**Docker:** Multi-stage Build, `node:20-alpine`, Port 3000, Non-root User `nextjs`

---

## Lokale Entwicklung

```bash
cd services/admin-dashboard

# Abhängigkeiten
npm install --legacy-peer-deps

# Umgebungsvariablen (aus 1Password)
cp .env.example .env.local

# Dev-Server
npm run dev   # → http://localhost:3000

# Produktions-Build
npm run build
npm run start
```

---

## Projektstruktur

```
services/admin-dashboard/
├── src/
│   ├── app/
│   │   ├── api/              # 40+ API-Route-Handler
│   │   ├── (pages)/          # 30+ Seiten-Routen
│   │   ├── layout.tsx         # Root-Layout + Provider
│   │   ├── page.tsx           # Dashboard-Home
│   │   └── globals.css        # Design-Tokens (CSS-Variablen)
│   ├── components/            # 34+ UI-Komponenten
│   │   ├── ui/                # Radix UI Primitives
│   │   ├── charts/            # ECharts-Wrapper
│   │   └── overview/          # Dashboard-Panels
│   ├── lib/                   # 33+ Hilfs-Bibliotheken
│   │   ├── auth.ts            # API-Key-Auth
│   │   ├── nocodb.ts          # Directus/NocoDB-Client
│   │   ├── qdrant-rest.ts     # Qdrant-Client
│   │   ├── embeddings.ts      # Embedding-Service
│   │   └── fabrik-*.ts        # Snapshot-Engine
│   └── hooks/                 # React Custom Hooks
├── public/                    # Statische Assets
├── Dockerfile                 # Multi-stage Build
├── next.config.js
├── tailwind.config.ts
└── CLAUDE.md                  # Claude-Kontext-Guide
```

---

<div align="center">

Teil von [Core Platform](https://github.com/timo-goetz-ai/apki-core-platform) &nbsp;·&nbsp; Maintainer: [Timo Goetz](https://timo-goetz-ai.de)

</div>
