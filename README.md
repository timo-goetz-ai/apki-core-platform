<div align="center">

# Core Platform (AIOS)

**AI Automation Monorepo — Admin Dashboard, Core Engine, Crew API**

[![Build](https://img.shields.io/github/actions/workflow/status/timo-goetz-ai/core-platform/deploy.yml?branch=main&label=Deploy)](https://github.com/timo-goetz-ai/core-platform/actions)
[![Coolify](https://img.shields.io/badge/Hosting-Coolify%20%2F%20Hetzner-5C4EFF?logo=docker)](https://coolify.io)
[![License](https://img.shields.io/badge/License-Private-lightgrey)](.)

**Admin Dashboard:** [admin.automation-plus-ki.de](https://admin.automation-plus-ki.de) &nbsp;|&nbsp; **Auth:** Authentik SSO

</div>

---

## Was ist Core Platform?

Core Platform ist das operative Herzstück der `automation-plus-ki.de` Infrastruktur. Als Monorepo bündelt es das Admin-Dashboard, die AIOS Core Engine und die Crew API — alles was nötig ist, um KI-Agenten, Automationen und Daten zentral zu verwalten und zu überwachen.

---

## Services im Monorepo

| Service | Pfad | URL | Stack |
|---------|------|-----|-------|
| Admin Dashboard | `services/admin-dashboard` | [admin.automation-plus-ki.de](https://admin.automation-plus-ki.de) | Next.js 14 |
| AIOS Core | `services/aios-core` | intern | Python + FastAPI |
| Crew API | `services/crew-api` | intern | Python |

---

## Deployment

```
Push → main
  └→ GitHub Actions: Docker Build + Push → ghcr.io/timo-goetz-ai/core-platform-*
       └→ Coolify: Auto-Deploy auf Hetzner CX42 (46.224.145.109)
```

Alle Images: `ghcr.io/timo-goetz-ai/core-platform-{admin-dashboard,aios-core,crew-api}:latest`

---

## Infrastruktur

- **Server:** Hetzner CX42, Frankfurt — SSH: `root@46.224.145.109`
- **Orchestrierung:** Coolify (self-hosted)
- **Auth:** Authentik Forward Auth (SSO für alle Services)
- **Secrets:** 1Password Vault `03_INFRA_HETZNER_SERV`, Tag `homestack`

---

## Lokale Entwicklung

```bash
# Admin Dashboard
cd services/admin-dashboard
npm install
npm run dev  # → http://localhost:3000

# AIOS Core / Crew API
cd services/aios-core
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Architektur-Überblick

```
Core Platform
├── services/
│   ├── admin-dashboard/    # Next.js Frontend
│   ├── aios-core/          # FastAPI Core Engine
│   └── crew-api/           # CrewAI Agent Orchestration
├── .github/workflows/      # CI/CD Pipelines
└── docker-compose.yml      # Lokales Dev Setup
```

---

<div align="center">

Maintainer: [Timo Goetz](https://timo-goetz-ai.de) &nbsp;·&nbsp; [automation-plus-ki.de](https://automation-plus-ki.de)

</div>
