# SERVICES — URLs, Endpoints, UUIDs

**Stand:** 08.03.2026

---

## Apps (öffentlich)

| Service | URL | Status |
|---------|-----|--------|
| AI Agent Platform | https://agents.automation-plus-ki.de | ✅ Live |
| AI Voice Platform | https://voice.automation-plus-ki.de | ✅ Live |
| AppFlowy | https://appflowy.automation-plus-ki.de | ✅ Live |
| Dashboard | https://dashboard.automation-plus-ki.de | ⚠️ Merge ausstehend |

---

## MCP Server (*.automation-plus-ki.de)

| Server | Zweck |
|--------|-------|
| mcp-n8n | Workflow-Trigger, list_workflows |
| mcp-nocodb | Tabellenoperationen |
| mcp-postgres | SQL-Abfragen |
| mcp-qdrant | Vektor-Search |
| mcp-grafana | Metriken, Dashboards |
| mcp-coolify | Deployment |
| mcp-hetzner | Cloud-Infrastruktur |
| mcp-github | Repository, Commits |
| mcp-cloudflare | DNS, Edge |
| mcp-vaultwarden | Secrets |
| mcp-nextcloud | Dateien |
| mcp-authentik | Identity (aktuell ohne Tools) |
| mcp-prometheus | Monitoring |

---

## Homestack (intern)

- n8n, NocoDB, Authentik, Vaultwarden
- Qdrant, Redis
- Prometheus, Grafana, Loki, Promtail, cAdvisor
- PostgreSQL (6 Instanzen)

---

## Host

- **Hetzner:** <HETZNER_HOST>
- **Orchestrierung:** Coolify
