# AIOS – Service Referenz
> Hetzner Server: `46.224.145.109` | Tailscale: `100.124.39.4`
> Dashboard live: https://dashboard.automation-plus-ki.de

---

## Infrastruktur

| Service | URL | API-Key Pfad | Hinweis |
|---------|-----|-------------|---------|
| **Coolify** | https://coolify.automation-plus-ki.de | `Keys & Tokens` → API Tokens | Nur via Tailscale erreichbar |
| **Authentik** | https://auth.automation-plus-ki.de | `Admin` → `System` → Tokens | SSO für alle Services |

---

## Monitoring

| Service | URL | API-Key Pfad | Health-Endpoint |
|---------|-----|-------------|-----------------|
| **Grafana** | https://grafana.automation-plus-ki.de | `Administration` → `Service Accounts` → Token | `/api/health` |
| **Prometheus** | https://prometheus.automation-plus-ki.de | – (kein Auth nötig) | `/-/healthy` |

**ENV-Variable:** `GRAFANA_API_KEY` → in Coolify unter infra-dashboard eintragen

---

## Automation

| Service | URL | API-Key Pfad | Health-Endpoint |
|---------|-----|-------------|-----------------|
| **n8n** | https://n8n.automation-plus-ki.de | `Einstellungen` → `n8n API` → API Key erstellen | `/healthz` |

**ENV-Variable:** `N8N_API_KEY` → in Coolify unter infra-dashboard eintragen
**Workflows direkt:** https://n8n.automation-plus-ki.de/home/workflows

---

## Homestack

| Service | URL | API-Key Pfad | Health-Endpoint |
|---------|-----|-------------|-----------------|
| **Nextcloud** | https://nextcloud.automation-plus-ki.de | `Einstellungen` → `Sicherheit` → App-Token | `/status.php` |
| **NocoDB** | https://nocodb.automation-plus-ki.de | `Team & Settings` → `API Tokens` | `/api/v1/health` |
| **Vaultwarden** | https://vault.automation-plus-ki.de | Admin Panel | `/alive` |
| **Hoppscotch** | https://hoppscotch.automation-plus-ki.de | – | – |
| **Browserless** | https://browserless.automation-plus-ki.de | Config-File | `/pressure` |
| **Mailpit** | https://mail.automation-plus-ki.de | – | – |
| **AppFlowy** | https://appflowy.automation-plus-ki.de | – | – |

**ENV-Variable:** `NOCODB_API_KEY` → in Coolify unter infra-dashboard eintragen

---

## AI Projects

| Service | URL | Lokaler Code-Pfad |
|---------|-----|-------------------|
| **AI Agent Platform** | https://agents.automation-plus-ki.de | `~/Geschäft/STUDIO/03_AI_Engineering/07_Projects/03_ai-agent-platform/` |
| **AI Voice Platform** | https://voice.automation-plus-ki.de | `~/Geschäft/STUDIO/03_AI_Engineering/07_Projects/01_ai-voice-platform/` |

---

## MCP Server

| Service | URL | Health | Status |
|---------|-----|--------|--------|
| **MCP Grafana** | https://mcp-grafana.automation-plus-ki.de | `/health` | ✅ |
| **MCP n8n** | https://mcp-n8n.automation-plus-ki.de | `/health` | ✅ |
| **MCP Coolify** | https://mcp-coolify.automation-plus-ki.de | `/health` | ✅ |
| **MCP Hetzner** | https://mcp-hetzner.automation-plus-ki.de | `/health` | ✅ |
| **MCP GitHub** | https://mcp-github.automation-plus-ki.de | `/health` | ✅ |
| **MCP Cloudflare** | https://mcp-cloudflare.automation-plus-ki.de | `/health` | ✅ |
| **MCP Google** | https://mcp-google.automation-plus-ki.de | `/health` | ✅ |
| **MCP Filesystem** | https://mcp-filesystem.automation-plus-ki.de | `/health` | ✅ |
| **MCP Postgres** | https://mcp-postgres.automation-plus-ki.de | `/health` | ✅ |
| **MCP Prometheus** | https://mcp-prometheus.automation-plus-ki.de | `/health` | ✅ |
| **MCP Authentik** | https://mcp-authentik.automation-plus-ki.de | `/health` | ✅ |
| **MCP Qdrant** | https://mcp-qdrant.automation-plus-ki.de | `/health` | ✅ |
| **MCP NocoDB** | https://mcp-nocodb.automation-plus-ki.de | `/health` | ✅ |
| **MCP Nextcloud** | https://mcp-nextcloud.automation-plus-ki.de | `/health` | ⚠️ unhealthy |
| **MCP Vaultwarden** | https://mcp-vaultwarden.automation-plus-ki.de | `/health` | ⚠️ unhealthy |

---

## Coolify – App-Verwaltung

| App | Coolify-Link | Image |
|-----|-------------|-------|
| **infra-dashboard** | https://coolify.automation-plus-ki.de/project/j48g4kwo0kow4ckw0gc0o84g/production/application/046279494c60465d88e337efb54d5504 | `ghcr.io/timogoetz1988/infra-dashboard:latest` |

**ENV-Variablen setzen (Produktion):**
→ Coolify → infra-dashboard → Environment Variables

| Variable | Wert |
|----------|------|
| `N8N_API_KEY` | _(aus n8n holen)_ |
| `N8N_BASE_URL` | `https://n8n.automation-plus-ki.de` |
| `NOCODB_API_KEY` | _(aus NocoDB holen)_ |
| `NOCODB_BASE_URL` | `https://nocodb.automation-plus-ki.de` |
| `GRAFANA_API_KEY` | _(aus Grafana holen)_ |
| `GRAFANA_BASE_URL` | `https://grafana.automation-plus-ki.de` |

---

## Lokale Code-Pfade

| Projekt | Pfad |
|---------|------|
| **infra-dashboard** | `~/aios/projects/infra-dashboard/` |
| **AI Agent Platform** | `~/Geschäft/STUDIO/03_AI_Engineering/07_Projects/03_ai-agent-platform/` |
| **AI Voice Platform** | `~/Geschäft/STUDIO/03_AI_Engineering/07_Projects/01_ai-voice-platform/` |
| **Bruno API Tests** | `~/Geschäft/STUDIO/03_AI_Engineering/01_APIs/02_bruno-api-tests/` |

---

## GitHub Repos

| Repo | URL |
|------|-----|
| **aios (privat)** | https://github.com/TimoGoetz1988/aios |
| **AI Agent Platform** | https://github.com/TimoGoetz1988/ai-agent-platform |

---

## Neu deployen (nach Code-Änderungen)

```bash
cd ~/aios/projects/infra-dashboard

# Image bauen + pushen
docker build --platform linux/amd64 -t ghcr.io/timogoetz1988/infra-dashboard:latest .
docker push ghcr.io/timogoetz1988/infra-dashboard:latest

# Deploy in Coolify triggern
curl -s -X POST \
  -H "Authorization: Bearer 17|coolify-cursor-562c27ff47c66281c2761b220a7e62865aa8933c" \
  "https://coolify.automation-plus-ki.de/api/v1/applications/046279494c60465d88e337efb54d5504/start"
```
