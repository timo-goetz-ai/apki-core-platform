

| Dienst | Terminal-Befehl (Konfiguration) | Was die KI dann kann |
| :---- | :---- | :---- |
| **mcp-filesystem** | npx \-y @modelcontextprotocol/server-filesystem /opt/mcp-ops | Dateien lesen, Logs analysieren, Skripte schreiben. |
| **mcp-postgres** | npx \-y @modelcontextprotocol/server-postgres "postgresql://user:pass@localhost:5432/n8n" | Datenbanken abfragen (z.B. "Wie viele n8n-Workflows liefen heute?"). |

🚀 **Service-Masterliste: automation-plus-ki.de**

**Server:** 46.224.145.109 (Hetzner) | **Status:** 04.03.2026

| Kategorie | Service | URL / Zugang | Zugriff / Credentials | Hauptnutzen |
| :---- | :---- | :---- | :---- | :---- |
| **Core** | **Dashboard** | [Link](https://dashboard.automation-plus-ki.de/) | SSO (akadmin) | Zentrale Übersicht |
|  | **Authentik** | [Link](https://auth.automation-plus-ki.de/) | akadmin / Homestack2026 | Identity Provider (IdP) |
|  | **Coolify** | [100.124.39.4](https://www.google.com/search?q=http://100.124.39.4) | **Nur via Tailscale** | Container & Deployment |
| **Automation** | **n8n** | [Link](https://n8n.automation-plus-ki.de/) | SSO \+ n8n-Login\* | Workflow-Automatisierung |
|  | **NocoDB** | [Link](https://nocodb.automation-plus-ki.de/) | SSO | No-Code Datenbank UI |
|  | **Nextcloud** | [Link](https://nextcloud.automation-plus-ki.de/) | SSO | Cloud-Speicher & Kalender |
| **Monitoring** | **Grafana** | [Link](https://grafana.automation-plus-ki.de/) | SSO | Visualisierung & Metriken |
|  | **Prometheus** | [Link](https://prometheus.automation-plus-ki.de/) | SSO | Datenquelle für Metriken |
| **Tools** | **Vaultwarden** | [Link](https://vault.automation-plus-ki.de/) | SSO (OIDC) | Passwort-Management |
|  | **Hoppscotch** | [Link](https://hoppscotch.automation-plus-ki.de/) | E-Mail (via Mailpit) | API-Testing |
|  | **Mailpit** | [Link](https://mail.automation-plus-ki.de/) | Kein Auth | SMTP-Catcher |
|  | **Steel Browser** | [Link](https://steel.automation-plus-ki.de/) | SSO | Browser-Automation |
|  | **Qdrant** | [Link](https://qdrant.automation-plus-ki.de/) | SSO | Vector-DB für AI / RAG |
| **AI Voice** | **Voice API** | [Link](https://voice.automation-plus-ki.de/) | JWT Bearer Token | AI Telefonie Plattform |

*\*n8n Login: admin@automation-plus-ki.de / Homestack2026*  
🤖 **MCP-Server (Claude / AI-Agents)**

Diese Server sind für die direkte Maschine-zu-Maschine Kommunikation optimiert und via **Bearer Token** geschützt.

| MCP Server | Ziel-System | API-Key Prefix | Funktion |
| :---- | :---- | :---- | :---- |
| mcp-coolify | Coolify | 1befa38... | Deployments & Logs steuern |
| mcp-hetzner | Hetzner Cloud | eea0c9b... | Infra-Management (VM/FW) |
| mcp-cloudflare | Cloudflare | 25edc19... | DNS & Records verwalten |
| mcp-github | GitHub | dabac3d... | Repo- & Code-Operationen |
| mcp-google | G-Workspace | 435e5ff... | Drive, Sheets, Kalender |
| mcp-filesystem | Local FS | 52adba9... | Zugriff auf /opt/mcp-ops |
| mcp-postgres | Postgres (n8n) | d18bdf7... | Direkte DB-Abfragen |
| mcp-vaultwarden | Vaultwarden | 5319c5f... | Secrets auslesen |
| mcp-n8n | n8n | 1024b55... | Workflows triggern/status |
| *... weitere* | *Grafana, Qdrant, etc.* | *diverse* | *AutomationPlusKI2025\! API-Zugriffe* |

