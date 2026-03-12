# SYSTEM_OVERVIEW

Dieser Überblick verknüpft deine Hauptsysteme (n8n, Dashboard, NocoDB, AppFlowy, Agents-Plattform, Grafana) mit Rollen, Integrationen und Verantwortlichkeiten, damit nichts „vergessen“ wird.

## 1. Systemlandschaft (High-Level)

```mermaid
flowchart LR
  user[User/Team] --> homedash[Homestack_Dashboard]

  homedash --> n8n[n8n_Workflows]
  homedash --> grafana[Grafana]
  homedash --> nocodb[NocoDB]
  homedash --> agents[Agents_Platform]
  homedash --> appflowy[AppFlowy]

  n8n --> aiControl[AI_Control_API_(geplant)]
  agents --> aiControl

  aiControl --> mcp[MCP_Services]
  aiControl --> github[GitHub]
  aiControl --> data[Postgres/NocoDB]

  grafana -->|Metriken| prom[Prometheus]
  prom --> infra[Infra/Hetzner]
```

## 2. Rollen je URL/Plattform

- **n8n (`https://n8n.automation-plus-ki.de/home/workflows`)**  
  - **Rolle**: Workflow-Orchestrierung (Events, Webhooks, GitHub, Monitoring).  
  - **Nicht vergessen**:
    - Flows klar prefixen (z. B. `AI/…`, `INFRA/…`, `INPUT/…`).
    - Regelmäßige Exports in ein Git-Repo (Infra-/Automation-Repo).

- **Homestack-Dashboard (`https://dashboard.automation-plus-ki.de`)**  
  - **Rolle**: Einstiegs- und Übersichts-UI.  
  - **Nicht vergessen**:
    - Links + Status-Anzeigen zu n8n, Grafana, NocoDB, AppFlowy, Agents, AI-Control-Center.
    - 3–5 Kern-KPIs aus Grafana einbetten.

- **NocoDB (`https://nocodb.automation-plus-ki.de/...`)**  
  - **Rolle**: UI auf deine Kern-Daten (Projekte, CRM, Systeme, Workflows, Incidents).  
  - **Nicht vergessen**:
    - Tabellen/Views nach Domänen benennen (z. B. `CRM_...`, `PROJECTS_...`, `SYSTEMS_...`).
    - Für jede Domäne: n8n-Flow + ggf. Grafana-Panel + kurze Markdown-Beschreibung.

- **AppFlowy (`https://appflowy.automation-plus-ki.de/...`)**  
  - **Rolle**: Wissens-/Notiz- und Planungs-Workspace.  
  - **Nicht vergessen**:
    - Spaces für: „Specs“, „Runbooks/Playbooks“, „Research/Ideen“.
    - Verlinkungen zurück zu GitHub-Repos, NocoDB-Tabellen und relevanten Dashboards.

- **Agents-Plattform (`https://agents.automation-plus-ki.de/`)**  
  - **Rolle**: Cockpit für AI-Agents (Runs, Logs, Status).  
  - **Nicht vergessen**:
    - Anbindung an AI-Control-API (Tasks, Model-Router, Access-Matrix).
    - Logging/Tracing der wichtigsten Agentenläufe in NocoDB/Grafana.

- **Grafana (`https://grafana.automation-plus-ki.de/dashboards`)**  
  - **Rolle**: Observability-Frontend.  
  - **Nicht vergessen**:
    - Mindestens drei Dashboards:
      - „Infra & Services“
      - „AI & Agents“
      - „Business & Projekte“.
    - Alert-Regeln (Prometheus) für Kernzustände (Services down, hohe Fehler-/Tokenraten).

## 3. „Nichts vergessen“-Checklisten (Kurzform)

- **Orchestrierung**  
  - Jeder wichtige Event-Typ (GitHub, Incident/Alert, geplanter Task, Intake) → _hat einen_ n8n-Workflow **und** einen Ziel-Agent/Endpoint im AI-Control-Center.

- **Daten**  
  - Jede NocoDB-Base/Ansicht → _hat_:
    - klaren Zweck (CRM / Projekte / Systeme / Lernen),
    - mindestens einen n8n-Flow,
    - wo sinnvoll ein Grafana-Panel.

- **Observability**  
  - Jeder Dienst mit URL → _hat_:
    - Health-Check (Prometheus/Grafana),
    - Sichtbarkeit im Homestack-Dashboard,
    - ggf. Alert-Regeln.

- **Rechte/Access**  
  - Für jeden Agenten/LLM → _ist definiert_:
    - was er lesen/schreiben/ausführen darf,
    - was explizit verboten ist (Access-Matrix).

## 4. Nächster Ausbauschritt

- `config/system-map.yaml` weiter pflegen (weitere Systeme, MCP-Server, AI-Control-Center, AIOS).  
- `SYSTEM_OVERVIEW.md` bei jedem größeren Architektur-Change kurz aktualisieren, damit es immer dein „One-Pager“ bleibt.

