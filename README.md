<div align="center">

# apki-core-platform (AIOS)

**AI Automation Monorepo — Admin Dashboard, Nexus Core, Crew API**

[![CI](https://img.shields.io/github/actions/workflow/status/timo-goetz-ai/apki-core-platform/ci.yml?branch=main&label=CI)](https://github.com/timo-goetz-ai/apki-core-platform/actions/workflows/ci.yml)
[![Deploy](https://img.shields.io/github/actions/workflow/status/timo-goetz-ai/apki-core-platform/deploy-prod.yml?label=Deploy)](https://github.com/timo-goetz-ai/apki-core-platform/actions/workflows/deploy-prod.yml)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-025E8C?logo=dependabot)](https://github.com/timo-goetz-ai/apki-core-platform/network/updates)
[![Coolify](https://img.shields.io/badge/Hosting-Coolify%20%2F%20Hetzner-5C4EFF?logo=docker)](https://coolify.io)
[![License](https://img.shields.io/badge/License-Private-lightgrey)](.)

**Admin Dashboard:** [admin.automation-plus-ki.de](https://admin.automation-plus-ki.de) · **Auth:** Authentik SSO

</div>

---

## Was ist apki-core-platform?

Selbst gehostetes **Betriebssystem für KI-Automatisierung** (AIOS). Das Monorepo bündelt Steuerzentrale, Backend-Kern und Agenten-Orchestrierung — deployed auf Hetzner via Coolify.

## Architektur

```mermaid
flowchart LR
  Client[Browser / Client]
  Admin[Admin Dashboard\nNext.js]
  Crew[Crew API\nFastAPI + CrewAI]
  Nexus[nexus-core\nFastAPI]
  PG[(PostgreSQL)]
  Redis[(Redis)]

  Client --> Admin
  Admin -->|REST / WebSocket| Nexus
  Admin -->|Start Crews| Crew
  Crew --> Redis
  Nexus --> PG
  Nexus --> Redis
```

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, React, TypeScript, Tailwind |
| Backend | Python 3.11+, FastAPI, CrewAI, Alembic |
| Data | PostgreSQL 15, Redis 7 |
| Infra | Hetzner, Coolify, Docker, Terraform, Cloudflare |
| CI/CD | GitHub Actions, GHCR, Dependabot |
| Auth | Authentik SSO, 1Password secrets |

## Services

| Service | Pfad | Stack |
|---------|------|-------|
| Admin Dashboard | `services/admin-dashboard` | Next.js 14 |
| **nexus-core** | `services/nexus-core` | Python FastAPI |
| Crew API | `services/crew-api` | Python FastAPI + CrewAI |
| Landing Page | `services/landing-page` | Next.js (Marketing) |

## Quick Links

- [Onboarding Guide](docs/ONBOARDING.md)
- [Nexus Core Zugriff](docs/NEXUS_CORE_ZUGRIFF.md)
- [Operations Runbook](docs/OPERATIONS.md)
- [Cost Breakdown](docs/COSTS.md)
- [Architecture (Infra)](infrastructure/ARCHITECTURE.md)
- [ADRs](docs/adr/)

## Deployment

```
Push → main
  └→ GitHub Actions: Docker Build + Push → ghcr.io/timo-goetz-ai/nexus-*
       └→ Coolify: Auto-Deploy auf Hetzner CPX42
```

Docker images: `ghcr.io/timo-goetz-ai/nexus-core`, `nexus-admin-dashboard`, `nexus-crew-api`

---

## Infrastruktur

- **Server:** Hetzner CPX42 — SSH via 1Password / privaten Deploy-Key (IP nicht im Repo)
- **Orchestrierung:** Coolify (self-hosted)
- **Auth:** Authentik Forward Auth (SSO für alle Services)
- **Secrets:** 1Password Vault `03_INFRA_HETZNER_SERV`, Tag `homestack`

---

## Local Development

```bash
cp .mcp.json.example .mcp.json   # edit with your tokens (never commit)
npm install
npm run dev          # docker compose: nexus-core + dashboard + crew-api
npm run admin:dev    # dashboard hot reload
npm run test         # Jest smoke tests
npm run test:python  # pytest for FastAPI services
```

## Repo Structure

```
apki-core-platform/
├── services/
│   ├── admin-dashboard/   # Next.js UI
│   ├── nexus-core/        # FastAPI core engine
│   ├── crew-api/          # CrewAI orchestration
│   └── landing-page/      # Marketing site
├── docs/                  # ONBOARDING, OPERATIONS, COSTS, ADRs
├── infrastructure/        # Terraform, MCP servers, monitoring
├── .github/workflows/     # CI/CD
└── docker-compose.yml     # Local dev stack
```

---

Maintainer: [Timo Goetz](https://timo-goetz-ai.de) · [automation-plus-ki.de](https://automation-plus-ki.de)
