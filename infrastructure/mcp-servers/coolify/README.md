# Coolify MCP Server

Ein [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) Server zur Steuerung von [Coolify](https://coolify.io/) - der Open-Source PaaS-Plattform.

Ermoeglicht es LLMs (z.B. Claude) direkt auf deine Coolify-Instanz zuzugreifen: Apps deployen, Logs ansehen, Env-Variablen setzen, Backups verwalten und mehr.

## Features

| Tool | Beschreibung |
|---|---|
| `list_applications` | Alle Applikationen auflisten |
| `get_application_details` | Vollstaendige Details einer App |
| `deploy_application` | Deployment triggern |
| `get_deployment_logs` | Deployment-Logs abrufen |
| `set_environment_variable` | Env-Variable setzen/updaten |
| `get_environment_variables` | Alle Env-Variablen einer App |
| `restart_application` | App neustarten |
| `get_application_status` | Status, Health-Check, Limits |
| `view_logs` | Container Runtime-Logs |
| `trigger_backup` | Datenbank-Backup starten |
| `list_backups` | Alle Backups einer Datenbank |
| `restore_from_backup` | Backup verifizieren & Restore-Info |

## Voraussetzungen

- Node.js >= 18
- Zugang zu einer Coolify-Instanz
- Coolify API-Token (unter **Settings > API Tokens** in Coolify erstellen)

## Setup

### 1. Repository klonen & Dependencies installieren

```bash
cd coolify-mcp-server
npm install
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

Editiere `.env`:

```env
COOLIFY_URL=https://coolify.example.com
COOLIFY_TOKEN=dein-api-token-hier
```

### 3. Bauen & Starten

```bash
npm run build
npm start
```

## Verwendung mit Claude Desktop

Fuege den Server in deine Claude Desktop Konfiguration ein:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "coolify": {
      "command": "node",
      "args": ["/absoluter/pfad/zu/coolify-mcp-server/dist/index.js"],
      "env": {
        "COOLIFY_URL": "https://coolify.example.com",
        "COOLIFY_TOKEN": "dein-api-token"
      }
    }
  }
}
```

## Verwendung mit Claude Code

Fuege den Server als MCP-Server in deine Claude Code Settings ein:

```bash
claude mcp add coolify -- node /absoluter/pfad/zu/coolify-mcp-server/dist/index.js
```

Oder in `.claude/settings.json`:

```json
{
  "mcpServers": {
    "coolify": {
      "command": "node",
      "args": ["/absoluter/pfad/zu/coolify-mcp-server/dist/index.js"],
      "env": {
        "COOLIFY_URL": "https://coolify.example.com",
        "COOLIFY_TOKEN": "dein-api-token"
      }
    }
  }
}
```

## Entwicklung

```bash
# TypeScript im Watch-Modus kompilieren
npm run dev

# In einem zweiten Terminal den Server starten
npm start
```

## Coolify API Referenz

Der Server nutzt die Coolify REST API v1:

| Endpoint | Methode | Beschreibung |
|---|---|---|
| `/api/v1/applications` | GET | Alle Apps listen |
| `/api/v1/applications/{uuid}` | GET | App-Details |
| `/api/v1/deploy?uuid={uuid}` | GET | Deployment triggern |
| `/api/v1/applications/{uuid}/restart` | GET | App neustarten |
| `/api/v1/applications/{uuid}/logs` | GET | Runtime-Logs |
| `/api/v1/applications/{uuid}/envs` | GET/POST/PATCH | Env-Variablen |
| `/api/v1/deployments` | GET | Deployments listen |
| `/api/v1/deployments/{uuid}` | GET | Deployment-Details |
| `/api/v1/databases/{uuid}/backups` | GET/POST | Backups |

Vollstaendige API-Dokumentation: https://coolify.io/docs/api-reference/api/

## Projektstruktur

```
coolify-mcp-server/
  src/
    index.ts                    # MCP Server Entry Point
    coolify-client.ts           # Coolify API Wrapper
    tools/
      index.ts                  # Tool-Registry & Export
      list-applications.ts
      get-application-details.ts
      deploy-application.ts
      get-deployment-logs.ts
      set-environment-variable.ts
      get-environment-variables.ts
      restart-application.ts
      get-application-status.ts
      view-logs.ts
      trigger-backup.ts
      list-backups.ts
      restore-from-backup.ts
  .env.example
  package.json
  tsconfig.json
```

## Lizenz

MIT
