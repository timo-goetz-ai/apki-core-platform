# KI-Flow Infra Dashboard

Real-time health monitoring for the KI-Flow / automation-plus-ki.de infrastructure stack on Hetzner CPX42, managed via Coolify.

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| State | Zustand |
| Data Fetching | SWR (30s polling) |
| Icons | Lucide React |
| Deployment | Coolify (Docker, auto-deploy from GitHub) |
| Secrets | 1Password → Coolify env vars |
| Backup/Storage | Hetzner Object Storage (S3) |

## Monitored Services

| Service | Category | Health Endpoint |
|---------|----------|-----------------|
| MCP Hub | AI / MCP | `/health` |
| n8n | Automation | `/healthz` (JSON) |
| NocoDB | Data | `/api/v1/health` (JSON) |
| Grafana | Monitoring | `/api/health` (JSON) |
| Prometheus | Monitoring | `/-/healthy` |
| Authentik | Auth & SSO | `/-/health/ready/` |
| Hetzner Storage | Storage | S3 root (403 = reachable) |
| Home Assistant | Smart Home | `/api/` (JSON) |

> Nextcloud and Vaultwarden are **not** part of this stack.  
> Secrets are managed via **1Password** → injected into Coolify as env vars.  
> File storage uses **Hetzner Object Storage** (S3-compatible, region: fsn1).

## Architecture

```
Browser → Next.js API Route (/api/proxy/[service]) → Internal Service URL
                   ↑
         Coolify env vars inject API keys server-side
         CORS never reaches browser
         Secrets sourced from 1Password
```

## Quick Start (Local Dev)

```bash
# 1. Clone
git clone https://github.com/TimoGoetz1988/PORTFOLIO_USE_CASES.git
cd ki-flow-dashboard

# 2. Configure
cp .env.example .env.local
# Fill in internal URLs and API tokens from 1Password

# 3. Dev
npm install
npm run dev

# 4. Build & test
npm run build && npm start
```

## Deployment via GitHub → Coolify

Coolify watches the `main` branch. On push, it builds and redeploys automatically.

```bash
# Manual trigger (if needed)
curl -X POST "$COOLIFY_DEPLOY_WEBHOOK"
```

GitHub Actions workflow (`.github/workflows/deploy.yml`) can optionally notify
Coolify on merge to main — set `COOLIFY_WEBHOOK_URL` as a GitHub secret.

```yaml
# .github/workflows/deploy.yml (optional — Coolify Git polling usually sufficient)
name: Deploy to Coolify
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Coolify deploy
        run: |
          curl -s -X POST "${{ secrets.COOLIFY_WEBHOOK_URL }}"
```

## Environment Variables

All secrets live in **1Password** and are pasted into Coolify's environment variable UI.
Never commit secrets to the repo — `.env.local` is in `.gitignore`.

```bash
# Internal service URLs (Coolify Docker network)
N8N_INTERNAL_URL=http://n8n:5678
NOCODB_INTERNAL_URL=http://nocodb:8080
GRAFANA_INTERNAL_URL=http://grafana:3000
PROMETHEUS_INTERNAL_URL=http://prometheus:9090
AUTHENTIK_INTERNAL_URL=http://authentik-server:9000
MCP_HUB_INTERNAL_URL=http://mcp-hub:8000
HA_INTERNAL_URL=http://homeassistant:8123

# Hetzner Object Storage (S3)
HETZNER_STORAGE_URL=https://fsn1.your-objectstorage.com
HETZNER_STORAGE_INTERNAL_URL=https://fsn1.your-objectstorage.com

# API tokens (from 1Password)
N8N_API_KEY=...
GRAFANA_SERVICE_ACCOUNT_TOKEN=...
NOCODB_API_TOKEN=...
HA_LONG_LIVED_TOKEN=...
PROMETHEUS_BASIC_AUTH=user:password   # base64-encoded server-side
```

## Adding a Service

1. Edit `src/lib/services.config.ts` → add entry to `SERVICES` array
2. Add env vars to `.env.example`
3. Add auth header case to `src/app/api/proxy/[service]/route.ts` (if needed)
4. Add env vars to Coolify (sourced from 1Password)
5. Push to `main` → Coolify redeploys

## Poll Interval

Default: **30 seconds**. Adjust in `src/hooks/useHealthCheck.ts`:
```ts
const POLL_INTERVAL = 30_000; // ms
```

## Hetzner Storage Health Check Note

Hetzner Object Storage (S3) returns `HTTP 403` on unauthenticated requests to the
bucket root — this is expected and indicates the service is **reachable**.
The proxy treats `403` as `online` for `proxyKey: "hetzner-storage"`.
