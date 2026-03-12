# Agent Control Center — Kontext für nächste Session

**Projekt:** Dashboard für automation-plus-ki.de — **NICHT Streamlit**, sondern **Agenten-Plattform mit Live-Observability**  
**URL:** https://dashboard.automation-plus-ki.de  
**Server:** Hetzner 46.224.145.109 | Coolify | Authentik SSO

---

## Architektur-Richtung (NEU)

**Kein Streamlit.** Stattdessen:
- **FastAPI Backend** — CrewAI + LangGraph, MCP-Integration, SSE-Event-Streaming
- **Next.js Frontend** — Live-Agenten-Visualisierung, Crew Launcher, Task-Timeline
- **Redis Pub/Sub** — Event-Broadcasting für horizontale Skalierung
- **Agenten bewegen sich** — Task-Level-Observability, sichtbare Agenten-Aktivität

Vollständige Architektur: **ARCHITEKTUR_AGENTEN.md**

---

## GitHub-Frameworks für Agent-Visualisierung

| Repo | Beschreibung | Technik |
|------|--------------|---------|
| **coding-by-feng/ai-agent-session-center** | 3D-Dashboard, animierte Roboter pro Session, Live-Terminals | TypeScript, React 19, Vite |
| **honorstudio/claude-ville** | Isometrisches Pixel-Art, Agenten im Dorf, WebSocket-Updates | JavaScript, zero deps |
| **wesm/agentsview** | Go-App, Heatmaps, Analytics, Multi-Agent-Support | Go |
| **CrewAI PR #2321** | Rich Console-Visualisierung, Panels, Trees | Python |

---

## Aktueller Stand (Legacy — Streamlit)

*Wird ersetzt durch Agent-Architektur.*

- **dashboard.py** — Streamlit, Auth, Layout
- **layout.py** — Sidebar, Agent-Cards, Task-Feed (Platzhalter)
- **widgets.py** — Statische Metrics
- **config.SERVICES** — n8n, NocoDB, Grafana, Prometheus, Authentik, Qdrant

**Nicht mehr gewünscht:** Vaultwarden, Nextcloud, Hoppscotch, Browserless

---

## Geplante Services (Sidebar)

**Behalten:** n8n, NocoDB, Grafana, Prometheus, Authentik, Qdrant  
**Ergänzen:** Voice AI, Agents, Mailpit, AppFlowy, Hetzner S3  
**Raus:** Vaultwarden, Nextcloud

---

## Geplante Features (unverändert)

1. **Lead- & Event-Feed** — Voice, Formulare, Recherchen, Mailpit → NocoDB → Dashboard
2. **Projekt-Kanban** — Status, MCPs, Skills, Rules, Plugins, Security-Check
3. **Security-Layer** — Checkliste vor Projektstart
4. **MCP-Health-Dashboard** — Live-Status aller MCP-Server
5. **Kontaktformular-Pipeline** — Zentrales Formular → n8n → NocoDB
6. **Hetzner S3** — Links zu Object Storage

---

## NocoDB-Tabellen

leads, projekte, security_checks, anfragen, crew_executions

---

## MCP-Server (automation-plus-ki.de)

mcp-n8n, mcp-coolify, mcp-grafana, mcp-hetzner, mcp-github, mcp-cloudflare, mcp-google, mcp-filesystem, mcp-postgres, mcp-prometheus, mcp-authentik, mcp-qdrant, mcp-nocodb

**Nicht mehr relevant:** mcp-nextcloud, mcp-vaultwarden

---

## Wichtige Dateien

| Datei | Zweck |
|-------|-------|
| ARCHITEKTUR_AGENTEN.md | CrewAI+LangGraph, FastAPI, Next.js, Docker Compose |
| DASHBOARD_ERWEITERUNG_IDEEN.md | Roadmap, NocoDB-Schema, Features |
| CONTEXT_DASHBOARD.md | Dieser Kontext |
| GEMINI_AUSWERTUNG_TABELLEN.md | Service-URLs, Credentials-Hinweise |
