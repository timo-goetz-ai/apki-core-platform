# Coolify Deployment – Bewerbungs-Automation

## Option A: Homestack nutzen (aktuell)

N8n und NocoDB laufen bereits in **homestack** (Coolify). Kein separates Deployment nötig.

## Option B: Eigener Stack via Coolify MCP

Falls du einen **isolierten** Stack für dieses Projekt willst:

1. **mcp-coolify** in Cursor Settings → MCP aktivieren
2. Token in `06_mcp-config/mcp.json` eintragen (REPLACE_WITH_COOLIFY_TOKEN)
3. In Coolify: Neues Projekt → Docker Compose
4. Repo/Path: `03_AI_Engineering/coolify/docker-compose.yml`
5. Env-Vars setzen: N8N_PASSWORD, NC_AUTH_JWT_SECRET, NC_PUBLIC_URL
6. Deploy via Coolify MCP: `deploy_application` mit app_id

## Coolify MCP Tools

- `deploy_application` – App deployen (app_id)
- `trigger_backup` – Backup auslösen

## Domains (bei Option B)

- n8n-bewerbung.automation-plus-ki.de
- nocodb-bewerbung.automation-plus-ki.de

DNS in Cloudflare anlegen, Coolify/Traefik übernimmt TLS.
