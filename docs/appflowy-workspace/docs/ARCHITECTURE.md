# ARCHITECTURE — Gesamtsystem

**Stand:** 08.03.2026

---

## Übersicht

Selbst-verwaltetes AI-Engineering-Ökosystem: eigene Infrastruktur, MCP-Anbindung, Command-Center-App. **Ziel: Autonomie** — kein Lock-in bei externen AI-Plattformen.

---

## Schichten

```
┌─────────────────────────────────────────────────────────┐
│  APPS (Traefik)                                         │
│  agents.automation-plus-ki.de | voice. | appflowy.      │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│  HOMESTACK (24 Services)                                │
│  n8n | NocoDB | Authentik | Vaultwarden | Qdrant        │
│  Prometheus | Grafana | Loki | Redis | PostgreSQL       │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│  MCP STACK (18 Server)                                  │
│  github | cloudflare | hetzner | coolify | n8n          │
│  postgres | nocodb | qdrant | grafana | ...             │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│  HOST: Hetzner 46.224.145.109 (Coolify)                 │
└─────────────────────────────────────────────────────────┘
```

---

## Kernkomponenten

| Komponente | Zweck |
|------------|-------|
| **AI Agent Platform** | Command Center für n8n, MCP, Workflows |
| **AI Voice Platform** | REST API für TTS/STT, Twilio-Integration |
| **n8n** | Workflow-Orchestrierung (18 Workflows, 1 aktiv) |
| **NocoDB** | Tabellen, Schemas für KI-Bewerbungs-Automation |
| **Qdrant** | Vector-DB (vorhanden, aktuell ungenutzt) |
| **MCP** | Tool-Anbindung für Claude/Cursor |

---

## Abhängigkeiten

- **Coolify** → Deployment aller Apps
- **Authentik** → SSO, Identity
- **Traefik** → API Gateway, Reverse Proxy
- **1Password + Coolify** → Secrets

---

## Offene Baustellen

1. Dashboard-Merge (dashboard. → agents. redirect)
2. AppFlowy MCP Server
3. n8n-Workflows aufräumen
4. Qdrant aktivieren oder abschalten
5. ARCHITECTURE.md (dieses Dokument) in Root pflegen
