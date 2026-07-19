# 👋 Onboarding Guide

Willkommen im **apki-core-platform** Monorepo (AIOS).

## Setup (5 min)

```bash
git clone git@github.com:timo-goetz-ai/apki-core-platform.git
cd apki-core-platform
cp .mcp.json.example .mcp.json
# Secrets aus 1Password eintragen — niemals committen
npm install
```

Optional: Python-Services lokal

```bash
cd services/nexus-core && pip install -r requirements.txt
cd ../crew-api && pip install -r requirements.txt
```

## Local Development

```bash
# Gesamter Stack (Docker)
npm run dev

# Nur Admin-Dashboard (Hot Reload)
npm run admin:dev

# Tests
npm run test
npm run test:python
npm run test:coverage
```

| Service | URL | Stack |
|---------|-----|-------|
| Admin Dashboard | http://localhost:3000 | Next.js 14 |
| nexus-core | http://localhost:8000 | Python FastAPI |
| crew-api | http://localhost:8002 | Python FastAPI + CrewAI |

## Environment Variables

Siehe `.env.example` im Repo-Root und service-spezifische `.env.example` Dateien.

| Variable | Service | Beschreibung |
|----------|---------|--------------|
| `DATABASE_URL` | nexus-core | PostgreSQL Connection String |
| `REDIS_URL` | nexus-core, crew-api | Redis für Events/Cache |
| `DASHBOARD_API_KEY` | admin-dashboard | API-Key für Route Handlers |
| `AIOS_TOKEN` | nexus-core | Bearer Token für Core API |
| `OPENROUTER_API_KEY` | nexus-core, crew-api | LLM Provider |

Secrets: **1Password Vault** — nie in Git committen.

## First PR Checklist

- [ ] Tests grün (`npm run test` + `npm run test:python`)
- [ ] Lint grün (`npm run lint`)
- [ ] Keine Secrets in Diff
- [ ] README/Docs bei Architektur-Änderungen aktualisiert
- [ ] Coverage nicht gesunken (`npm run test:coverage`)

## Troubleshooting

**Port conflicts**
- 3000 = Dashboard, 8000 = nexus-core, 8002 = crew-api
- `lsof -i :8000` zum Freigeben

**Postgres connection**
- `docker compose up aios-db -d`
- `DATABASE_URL=postgresql+asyncpg://aios_user:aios_pass@localhost:5432/aios_db`

**API errors**
- Health: `curl http://localhost:8000/health`
- Logs: `docker compose logs nexus-core -f`

## Weitere Docs

- [Architecture](../infrastructure/ARCHITECTURE.md)
- [Operations](./OPERATIONS.md)
- [Costs](./COSTS.md)
- [ADRs](./adr/)
