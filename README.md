# Core Platform (AIOS)

AI automation platform monorepo — admin dashboard, APIs, agents, and infrastructure for automation-plus-ki.de.

**Account:** admin@timo-goetz-ai.de  
**Repo:** [timo-goetz-ai/core-platform](https://github.com/timo-goetz-ai/core-platform) (private)  
**Hosting:** Coolify on Hetzner (46.224.145.109)

## Services

| Service | Path | URL | Stack |
|---------|------|-----|-------|
| Admin Dashboard | `services/admin-dashboard` | [admin.automation-plus-ki.de](https://admin.automation-plus-ki.de) | Next.js 14 |
| AIOS Core | `services/aios-core` | internal | Python + FastAPI |
| Crew API | `services/crew-api` | internal | Python |

## Deploy

Push to `main` → GitHub Actions builds Docker images → Coolify deploys.

**Rule:** Always verify a successful build for the affected service before pushing.

```bash
# Admin Dashboard
cd services/admin-dashboard && npm run build
```

No local Docker required. All deployments through CI/CD.

## Images

```
ghcr.io/timo-goetz-ai/core-platform-admin-dashboard:latest
ghcr.io/timo-goetz-ai/core-platform-aios-core:latest
ghcr.io/timo-goetz-ai/core-platform-crew-api:latest
```

## Coolify

- **Admin Dashboard UUID:** `gsc8oscgw0kswsooc484swcw`
- **Coolify:** [coolify.automation-plus-ki.de](https://coolify.automation-plus-ki.de)

## Auth

Authentik SSO — all services behind Forward Auth at [auth.automation-plus-ki.de](https://auth.automation-plus-ki.de).

## Secrets

All secrets in 1Password Vault `05_INFRASTRUCTURE`. Never in repo or env files.

## Structure

```
services/
├── admin-dashboard/    # Next.js 14 ops UI
├── aios-core/          # Python core API
└── crew-api/           # Python agent orchestration
agents/                 # Agent definitions
infra/                  # Infrastructure config
docs/                   # Operations documentation
.github/workflows/      # CI/CD pipelines
```

## n8n Workflows (Layer Architecture)

| Layer | Range | Purpose |
|-------|-------|---------|
| INGEST | 100–199 | Data ingestion (webhook, mobile) |
| BRAIN | 200–299 | AI routing, logging, discovery |
| RESEARCH | 300–399 | Trends, sentiment, content opportunities |
| CONTENT | 400–499 | Content pipeline, TTS, templates |
| HUMAN | 500–599 | Telegram, approvals, reports |
