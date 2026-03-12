# MCP Server Dokumentation

## Uebersicht

5 Custom MCP Server + 1 SSH-Zugang (deaktiviert) + 2 NPX-basierte Server fuer die AI-Agent-Integration.

## Custom MCP Server

Alle Custom Server folgen dem gleichen Pattern:
- **Runtime:** Node.js + TypeScript
- **Framework:** `@modelcontextprotocol/sdk`
- **Deployment:** Docker Container via Coolify
- **Authentifizierung:** API-Key Header

### cloudflare-dns

**Beschreibung:** DNS-Verwaltung fuer automation-plus-ki.de

| Tool | Beschreibung |
|------|-------------|
| `list_zones` | Alle DNS-Zonen auflisten |
| `get_zone_details` | Zone-Details abrufen |
| `list_dns_records` | DNS-Records einer Zone |
| `create_dns_record` | Neuen Record erstellen |
| `update_dns_record` | Record aktualisieren |
| `delete_dns_record` | Record loeschen |
| `verify_token` | API-Token validieren |

**Env-Vars:** `CLOUDFLARE_API_KEY`, `CLOUDFLARE_EMAIL`

### coolify

**Beschreibung:** App-Deployment & Management ueber Coolify API

| Tool | Beschreibung |
|------|-------------|
| `list_applications` | Alle Apps auflisten |
| `get_application_details` | App-Details |
| `deploy_application` | Deployment ausloesen |
| `get_deployment_logs` | Build-Logs abrufen |
| `set_environment_variable` | Env-Var setzen |
| `get_environment_variables` | Env-Vars auflisten |
| `restart_application` | App neustarten |
| `get_application_status` | Container-Status |
| `view_logs` | Runtime-Logs |
| `trigger_backup` | Backup ausloesen |
| `list_backups` | Backups auflisten |
| `restore_from_backup` | Backup wiederherstellen |

**Env-Vars:** `COOLIFY_URL`, `COOLIFY_TOKEN`

### hetzner-cloud

**Beschreibung:** Hetzner Cloud Server-Verwaltung

| Tool | Beschreibung |
|------|-------------|
| `list_servers` | Alle Server auflisten |
| `get_server_details` | Server-Details |
| `create_server` | Neuen Server erstellen |
| `ssh_command` | SSH-Befehl ausfuehren |
| `restart_server` | Server neustarten |
| `get_server_status` | Metriken & Status |
| `manage_firewall` | Firewall-Regeln |
| `list_volumes` | Volumes auflisten |
| `create_snapshot` | Snapshot erstellen |
| `list_images` | Verfuegbare Images |

**Env-Vars:** `HETZNER_TOKEN`

### google-workspace

**Beschreibung:** Google Workspace + Cloud APIs (Drive, Sheets, Calendar, Slides, Forms, IAM)

**55+ Tools** inklusive:
- Google Drive (Dateien, Ordner, Upload/Download)
- Google Sheets (CRUD, Tabs)
- Google Calendar (Events, Kalender)
- Google Slides (Praesentationen)
- Google Forms (Formulare, Antworten)
- IAM (Service Accounts, Rollen, API-Verwaltung)
- NL-Prompt-Engine (KI-gestuetzte Abfragen)

**Env-Vars:** `GOOGLE_APPLICATION_CREDENTIALS`, `GOOGLE_DELEGATED_USER`, `GOOGLE_PROJECT_ID`, `OPENAI_API_KEY`

### github

**Beschreibung:** GitHub API Integration

**Env-Vars:** `GITHUB_PERSONAL_ACCESS_TOKEN`

## NPX-basierte Server

### leads-db

```bash
npx @modelcontextprotocol/server-postgres postgresql://postgres:***@localhost:5433/saas_production
```

**Tool:** `query` - SQL-Abfragen ausfuehren

### gcp

```bash
npx @google-cloud/gcloud-mcp --project tgai-core-prod
```

**Tool:** `run_gcloud_command` - gcloud-Befehle ausfuehren

## SSH-Zugang (deaktiviert)

### hetzner-ssh

```bash
npx ssh-mcp --host=46.224.145.109 --user=root --key=~/.ssh/id_ed25519_hetzner_coolify
```

**Status:** Deaktiviert (Sicherheit - nur bei Bedarf aktivieren)

## Marketplace Connectors

Ueber claude.ai verbundene Services:

| Connector | Beschreibung |
|-----------|-------------|
| Hugging Face | Models, Datasets, Papers, Spaces (User: Timo1988) |
| Cloudflare Dev Platform | Workers, KV, R2, D1, Hyperdrive |
| Vercel | Deployments, Projects, Logs |
| Zapier Gmail | E-Mail senden, suchen, labeln |

## n8n Integration

n8n kann die gleichen APIs wie die MCP Server ansprechen:

| Service | API Base URL | Auth | n8n Node |
|---------|-------------|------|----------|
| Cloudflare | `api.cloudflare.com/client/v4` | Bearer Token | HTTP Request |
| Coolify | `coolify.automation-plus-ki.de/api/v1` | Bearer Token | HTTP Request |
| Hetzner | `api.hetzner.cloud/v1` | Bearer Token | HTTP Request |
| PostgreSQL | `localhost:5433` | User/Pass | PostgreSQL (native) |
| GCP | gcloud CLI | Service Account | Google Cloud Node |

## Lokale Entwicklung

```bash
# MCP Server lokal starten (Beispiel: cloudflare-dns)
cd mcp-servers/cloudflare-dns
cp .env.example .env
# -> Werte eintragen
npm install
npm run build
node dist/index.js
```
