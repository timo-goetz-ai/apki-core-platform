# Agenten-Framework mit CrewAI + LangGraph — Vollständige Architektur

**Stand:** 08.03.2026  
**Ziel:** Agenten, die sich bewegen, wenn sie arbeiten — Live-Observability auf Task/Agent-Ebene

---

## Übersicht

| Komponente | Technik |
|------------|---------|
| **Backend** | FastAPI, CrewAI, LangGraph |
| **Frontend** | Next.js, SSE/EventSource, CrewExecutionViewer, CrewLauncher |
| **Events** | Redis Pub/Sub, EventBroadcaster |
| **MCP** | MCPRegistry (Health-Check via JSON-RPC `initialize`, `tools/list`, `tools/call`) |
| **Integration** | n8n Webhooks, NocoDB REST API |
| **Deployment** | Docker Compose, Coolify |

---

## 1. CrewManager (agent-backend/app/services/crew_manager.py)

- **CrewManager** — Orchestriert CrewAI Crews mit MCP-Integration
- **TaskExecution** / **CrewExecution** — Pydantic-Modelle für Tracking
- **start_crew()** — AsyncGenerator, yieldet Events: `execution_started`, `task_started`, `task_completed`, `execution_completed`, `execution_error`
- MCP-Tools werden pro Agent aus `mcp_servers` geladen und injiziert
- Webhooks: `on_start`, `on_complete` → n8n
- Persistenz: NocoDB `crew_executions`

---

## 2. FastAPI Router (crews.py)

- `GET /` — Liste Crews
- `POST /{crew_id}/start` — Startet Crew, **StreamingResponse** (SSE)
- `GET /executions/{execution_id}` — Status einer Execution
- `POST /executions/{execution_id}/stop` — Stoppt Execution

---

## 3. EventBroadcaster (event_stream.py)

- Redis Pub/Sub
- `publish(execution_id, event)` — Event an Channel `execution:{id}`
- `subscribe(execution_id)` — PubSub für SSE-Streaming

---

## 4. MCPRegistry (mcp_registry.py)

- YAML-Config: `mcp_servers.yaml`
- `check_health(server_id)` — JSON-RPC `initialize` Handshake
- `list_tools(server_id)` — `tools/list` RPC
- `call_tool(server_id, tool_name, arguments)` — `tools/call` RPC
- `health_check_all()` — Alle Server parallel

---

## 5. MCP Router (mcp.py)

- `GET /servers` — Liste mit is_healthy, latency_ms, tool_count
- `GET /servers/{id}/health` — Health-Check (Background)
- `GET /servers/{id}/tools` — Tools eines Servers
- `POST /servers/{id}/tools/{name}/call` — Tool aufrufen
- `POST /health-check-all` — Alle prüfen (Background)

---

## 6. N8N Client (integrations/n8n.py)

- `get_workflows()`, `get_executions()`, `execute_workflow()`
- `trigger_webhook(url, payload)` — Für Crew-Events

---

## 7. NocoDB Client (integrations/nocodb.py)

- `list_tables()`, `list_records()`, `create_record()`, `update_record()`
- Header: `xc-auth` Token

---

## 8. Main (main.py)

- Lifespan: Redis connect, n8n/nocodb init, **health_check_loop** (alle 30s)
- Router: crews, agents, mcp
- `GET /health` — Redis, MCP-Status

---

## 9. Next.js Frontend

### useCrewStream Hook
- EventSource auf `/api/crews/executions/{id}`
- `events`, `isConnected`, `execution`, `reconnect`

### CrewExecutionViewer
- Status-Header (Execution ID, Badge)
- Task-Timeline (task_started, task_completed)
- MCP Tools Loaded
- Raw Event Log (Terminal-Style)

### CrewLauncher
- Input-Felder aus Crew-Config
- `startCrew()` Mutation → POST /start → EventSource mit execution_id
- `onExecutionStart(executionId)` → Wechsel zu Viewer

---

## 10. Crew-Konfiguration (Beispiel)

```yaml
crews:
  research_crew:
    name: "Research Crew"
    agents:
      - id: researcher
        role: "Research Analyst"
        goal: "Find information"
        mcp_servers: ["web-search", "database"]
      - id: writer
        role: "Content Writer"
    tasks:
      - id: research
        agent_id: researcher
        description: "Research the topic"
      - id: write
        agent_id: writer
        description: "Write article"
    process: sequential
    webhooks:
      on_start: "https://n8n.../webhook/crew-started"
      on_complete: "https://n8n.../webhook/crew-completed"
```

---

## 11. Docker Compose

```yaml
services:
  dashboard:      # Next.js, Port 3000
  agent-backend: # FastAPI, Port 8000
  redis:         # Port 6379
```

Volumes: `agent-logs`, `redis-data`  
Network: `coolify` (external)

---

## 12. Datenfluss

```
User startet Crew → POST /crews/{id}/start
  → CrewManager.start_crew()
  → MCP-Tools laden (tools/list)
  → CrewAI Crew mit Tools
  → Task-Events → Redis Pub/Sub
  → SSE → Frontend (CrewExecutionViewer)
  → NocoDB crew_executions
  → n8n Webhook
```

---

## 13. MCP-Server YAML (mcp_servers.yaml)

```yaml
servers:
  - id: mcp-n8n
    name: "n8n"
    url: "https://mcp-n8n.automation-plus-ki.de"
    transport: streamable-http
  - id: mcp-grafana
    name: "Grafana"
    url: "https://mcp-grafana.automation-plus-ki.de"
  # ...
```

---

## 14. .env (Beispiel)

```
N8N_API_URL, N8N_API_KEY
NOCODB_API_URL, NOCODB_API_TOKEN
REDIS_URL=redis://redis:6379/0
OPENAI_API_KEY, ANTHROPIC_API_KEY
```

---

## Referenzen

- [CrewAI Docs](https://docs.crewai.com/)
- [LangGraph](https://python.langchain.com/v0.2/docs/langgraph/)
- [MCP Spec](https://modelcontextprotocol.io/specification/2025-06-18/)
- [ai-agent-session-center](https://github.com/coding-by-feng/ai-agent-session-center) — 3D animierte Roboter
- [claude-ville](https://github.com/honorstudio/claude-ville) — Isometrisches Pixel-Art
