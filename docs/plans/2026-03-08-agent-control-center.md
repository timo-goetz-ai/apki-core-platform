# Agent Control Center — Implementierungsplan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Agenten-Plattform mit Live-Observability — FastAPI + CrewAI + LangGraph + Next.js + Redis, ersetzt Streamlit-Dashboard.

**Architecture:** Backend orchestriert CrewAI-Crews mit MCP-Tools, streamt Events via Redis Pub/Sub und SSE. Frontend zeigt CrewLauncher, CrewExecutionViewer mit Live-Task-Timeline. NocoDB für Persistenz, n8n für Webhooks.

**Tech Stack:** FastAPI, CrewAI, LangGraph, Redis, Next.js, SSE/EventSource, Pydantic, Docker Compose

**Referenzen:** ARCHITEKTUR_AGENTEN.md, CONTEXT_DASHBOARD.md, DASHBOARD_ERWEITERUNG_IDEEN.md

---

## Etappe 0: Projekt-Scaffold & Infrastruktur

### Task 0.1: Ordnerstruktur anlegen

**Files:**
- Create: `agent-backend/app/__init__.py`
- Create: `agent-backend/app/main.py` (leer, Platzhalter)
- Create: `agent-backend/requirements.txt`
- Create: `dashboard-nextjs/` (via npx create-next-app)

**Step 1: Backend-Ordner erstellen**

```bash
mkdir -p agent-backend/app/services agent-backend/app/routers agent-backend/app/integrations agent-backend/app/models agent-backend/config
touch agent-backend/app/__init__.py agent-backend/app/main.py
```

**Step 2: Backend requirements.txt**

```
fastapi>=0.115.0
uvicorn[standard]>=0.32.0
redis>=5.2.0
pydantic>=2.0
pydantic-settings>=2.0
pyyaml>=6.0
httpx>=0.27.0
crewai>=0.86.0
langgraph>=0.2.0
```

**Step 3: Next.js Scaffold**

```bash
cd dashboard-nextjs && npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

**Step 4: Commit**

```bash
git add agent-backend dashboard-nextjs
git commit -m "chore: add agent-backend and dashboard-nextjs scaffold"
```

---

### Task 0.2: Docker Compose Grundgerüst

**Files:**
- Create: `docker-compose.agent.yml`

**Step 1: docker-compose.agent.yml erstellen**

```yaml
services:
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis-data:/data]
  agent-backend:
    build: ./agent-backend
    ports: ["8000:8000"]
    env_file: .env
    depends_on: [redis]
    environment:
      REDIS_URL: redis://redis:6379/0
  dashboard:
    build: ./dashboard-nextjs
    ports: ["3000:3000"]
    env_file: .env
    depends_on: [agent-backend]

volumes:
  redis-data:

networks:
  default:
    name: coolify
    external: true
```

**Step 2: agent-backend Dockerfile**

Create: `agent-backend/Dockerfile`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Step 3: Commit**

```bash
git add docker-compose.agent.yml agent-backend/Dockerfile
git commit -m "chore: add Docker Compose for agent stack"
```

---

### Task 0.3: .env.example und Config

**Files:**
- Create: `agent-backend/.env.example`
- Create: `agent-backend/app/config.py`

**Step 1: .env.example**

```
REDIS_URL=redis://redis:6379/0
N8N_API_URL=
N8N_API_KEY=
NOCODB_API_URL=
NOCODB_API_TOKEN=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

**Step 2: config.py mit Pydantic Settings**

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379/0"
    n8n_api_url: str = ""
    n8n_api_key: str = ""
    nocodb_api_url: str = ""
    nocodb_api_token: str = ""
    openai_api_key: str = ""
    anthropic_api_key: str = ""
    class Config:
        env_file = ".env"
```

**Step 3: Commit**

```bash
git add agent-backend/.env.example agent-backend/app/config.py
git commit -m "feat: add backend config and env example"
```

---

## Etappe 1: EventBroadcaster & Redis

### Task 1.1: EventBroadcaster Service

**Files:**
- Create: `agent-backend/app/services/event_stream.py`
- Create: `agent-backend/app/models/events.py`

**Step 1: Pydantic Event-Modelle**

```python
# agent-backend/app/models/events.py
from pydantic import BaseModel
from typing import Literal
from datetime import datetime

class BaseEvent(BaseModel):
    type: str
    execution_id: str
    timestamp: datetime = None
    def __init__(self, **data):
        if "timestamp" not in data:
            data["timestamp"] = datetime.utcnow()
        super().__init__(**data)

class ExecutionStartedEvent(BaseEvent):
    type: Literal["execution_started"] = "execution_started"
    crew_id: str = ""

class TaskStartedEvent(BaseEvent):
    type: Literal["task_started"] = "task_started"
    task_id: str
    agent_id: str

class TaskCompletedEvent(BaseEvent):
    type: Literal["task_completed"] = "task_completed"
    task_id: str
    agent_id: str
    output: str = ""

class ExecutionCompletedEvent(BaseEvent):
    type: Literal["execution_completed"] = "execution_completed"

class ExecutionErrorEvent(BaseEvent):
    type: Literal["execution_error"] = "execution_error"
    error: str
```

**Step 2: EventBroadcaster implementieren**

```python
# agent-backend/app/services/event_stream.py
import json
import redis.asyncio as redis
from typing import AsyncGenerator
from app.models.events import BaseEvent

class EventBroadcaster:
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._client: redis.Redis | None = None

    async def connect(self):
        self._client = redis.from_url(self.redis_url, decode_responses=True)

    async def disconnect(self):
        if self._client:
            await self._client.aclose()

    def _channel(self, execution_id: str) -> str:
        return f"execution:{execution_id}"

    async def publish(self, execution_id: str, event: BaseEvent):
        if not self._client:
            raise RuntimeError("EventBroadcaster not connected")
        channel = self._channel(execution_id)
        await self._client.publish(channel, event.model_dump_json())

    async def subscribe(self, execution_id: str) -> AsyncGenerator[str, None]:
        if not self._client:
            raise RuntimeError("EventBroadcaster not connected")
        pubsub = self._client.pubsub()
        await pubsub.subscribe(self._channel(execution_id))
        async for msg in pubsub.listen():
            if msg["type"] == "message":
                yield msg["data"]
```

**Step 3: Commit**

```bash
git add agent-backend/app/models/events.py agent-backend/app/services/event_stream.py
git commit -m "feat: add EventBroadcaster and event models"
```

---

### Task 1.2: EventBroadcaster in main.py Lifespan

**Files:**
- Modify: `agent-backend/app/main.py`

**Step 1: FastAPI App mit Lifespan**

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.config import Settings
from app.services.event_stream import EventBroadcaster

settings = Settings()
broadcaster = EventBroadcaster(settings.redis_url)

@asynccontextmanager
async def lifespan(app: FastAPI):
    await broadcaster.connect()
    yield
    await broadcaster.disconnect()

app = FastAPI(lifespan=lifespan)

@app.get("/health")
async def health():
    return {"status": "ok", "redis": "connected"}
```

**Step 2: Test**

```bash
cd agent-backend && uvicorn app.main:app --reload
# curl http://localhost:8000/health
```

**Step 3: Commit**

```bash
git add agent-backend/app/main.py
git commit -m "feat: wire EventBroadcaster in FastAPI lifespan"
```

---

## Etappe 2: MCPRegistry & MCP Router

### Task 2.1: mcp_servers.yaml und MCPRegistry

**Files:**
- Create: `agent-backend/config/mcp_servers.yaml`
- Create: `agent-backend/app/services/mcp_registry.py`

**Step 1: mcp_servers.yaml**

```yaml
servers:
  - id: mcp-n8n
    name: "n8n"
    url: "https://mcp-n8n.automation-plus-ki.de"
    transport: streamable-http
  - id: mcp-grafana
    name: "Grafana"
    url: "https://mcp-grafana.automation-plus-ki.de"
    transport: streamable-http
```

**Step 2: MCPRegistry mit check_health, list_tools, call_tool**

Implementiere JSON-RPC `initialize`, `tools/list`, `tools/call` via httpx. Siehe MCP Spec: https://modelcontextprotocol.io/specification/2025-06-18/

```python
# agent-backend/app/services/mcp_registry.py
import yaml
import httpx
from pathlib import Path
from typing import Any

class MCPRegistry:
    def __init__(self, config_path: str = "config/mcp_servers.yaml"):
        self.config_path = Path(config_path)
        self._servers = []
        self._load_config()

    def _load_config(self):
        with open(self.config_path) as f:
            data = yaml.safe_load(f)
            self._servers = data.get("servers", [])

    def get_server(self, server_id: str) -> dict | None:
        for s in self._servers:
            if s.get("id") == server_id:
                return s
        return None

    async def check_health(self, server_id: str) -> tuple[bool, float]:
        # JSON-RPC initialize, messe Latenz
        ...

    async def list_tools(self, server_id: str) -> list[dict]:
        # tools/list RPC
        ...

    async def call_tool(self, server_id: str, tool_name: str, arguments: dict) -> Any:
        # tools/call RPC
        ...

    async def health_check_all(self) -> list[dict]:
        # Alle parallel prüfen
        ...
```

**Step 3: Commit**

```bash
git add agent-backend/config/mcp_servers.yaml agent-backend/app/services/mcp_registry.py
git commit -m "feat: add MCPRegistry and mcp_servers config"
```

---

### Task 2.2: MCP Router (FastAPI)

**Files:**
- Create: `agent-backend/app/routers/mcp.py`
- Modify: `agent-backend/app/main.py`

**Step 1: mcp.py Router**

```python
# agent-backend/app/routers/mcp.py
from fastapi import APIRouter, HTTPException
router = APIRouter(prefix="/mcp", tags=["mcp"])

@router.get("/servers")
async def list_servers():
    # MCPRegistry.health_check_all() → Liste mit is_healthy, latency_ms, tool_count
    ...

@router.get("/servers/{server_id}/health")
async def server_health(server_id: str):
    ...

@router.get("/servers/{server_id}/tools")
async def server_tools(server_id: str):
    ...

@router.post("/servers/{server_id}/tools/{tool_name}/call")
async def call_tool(server_id: str, tool_name: str, body: dict):
    ...
```

**Step 2: main.py Router einbinden**

```python
from app.routers import mcp
app.include_router(mcp.router)
```

**Step 3: Commit**

```bash
git add agent-backend/app/routers/mcp.py agent-backend/app/main.py
git commit -m "feat: add MCP API router"
```

---

## Etappe 3: Integrations (n8n, NocoDB)

### Task 3.1: NocoDB Client

**Files:**
- Create: `agent-backend/app/integrations/nocodb.py`

**Step 1: nocodb.py**

```python
# agent-backend/app/integrations/nocodb.py
import httpx
from app.config import Settings

class NocoDBClient:
    def __init__(self, settings: Settings):
        self.base_url = settings.nocodb_api_url.rstrip("/")
        self.token = settings.nocodb_api_token
        self._headers = {"xc-auth": self.token}

    async def list_tables(self) -> list:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{self.base_url}/api/v2/meta/bases", headers=self._headers)
            r.raise_for_status()
            return r.json()

    async def list_records(self, table_id: str, params: dict = None) -> list:
        ...

    async def create_record(self, table_id: str, data: dict) -> dict:
        ...

    async def update_record(self, table_id: str, record_id: str, data: dict) -> dict:
        ...
```

**Step 2: Commit**

```bash
git add agent-backend/app/integrations/nocodb.py
git commit -m "feat: add NocoDB client"
```

---

### Task 3.2: n8n Client

**Files:**
- Create: `agent-backend/app/integrations/n8n.py`

**Step 1: n8n.py**

```python
# agent-backend/app/integrations/n8n.py
import httpx
from app.config import Settings

class N8NClient:
    def __init__(self, settings: Settings):
        self.base_url = settings.n8n_api_url.rstrip("/")
        self.api_key = settings.n8n_api_key
        self._headers = {"X-N8N-API-KEY": self.api_key}

    async def get_workflows(self) -> list:
        ...

    async def get_executions(self, workflow_id: str = None) -> list:
        ...

    async def execute_workflow(self, workflow_id: str, data: dict = None) -> dict:
        ...

    async def trigger_webhook(self, url: str, payload: dict) -> dict:
        async with httpx.AsyncClient() as client:
            r = await client.post(url, json=payload)
            return {"status": r.status_code}
```

**Step 2: Commit**

```bash
git add agent-backend/app/integrations/n8n.py
git commit -m "feat: add n8n client"
```

---

## Etappe 4: CrewManager & Crews Router

### Task 4.1: Crew-Konfiguration und Modelle

**Files:**
- Create: `agent-backend/config/crews.yaml`
- Create: `agent-backend/app/models/crew.py`

**Step 1: crews.yaml (Beispiel research_crew)**

```yaml
crews:
  research_crew:
    name: "Research Crew"
    agents:
      - id: researcher
        role: "Research Analyst"
        goal: "Find information"
        mcp_servers: []
      - id: writer
        role: "Content Writer"
        goal: "Write content"
    tasks:
      - id: research
        agent_id: researcher
        description: "Research the topic"
      - id: write
        agent_id: writer
        description: "Write article"
    process: sequential
    webhooks:
      on_start: ""
      on_complete: ""
```

**Step 2: Pydantic Crew-Modelle**

```python
# agent-backend/app/models/crew.py
from pydantic import BaseModel
from typing import Optional

class AgentConfig(BaseModel):
    id: str
    role: str
    goal: str
    mcp_servers: list[str] = []

class TaskConfig(BaseModel):
    id: str
    agent_id: str
    description: str

class CrewConfig(BaseModel):
    name: str
    agents: list[AgentConfig]
    tasks: list[TaskConfig]
    process: str = "sequential"
    webhooks: dict = {}
```

**Step 3: Commit**

```bash
git add agent-backend/config/crews.yaml agent-backend/app/models/crew.py
git commit -m "feat: add crew config and models"
```

---

### Task 4.2: CrewManager Service

**Files:**
- Create: `agent-backend/app/services/crew_manager.py`

**Step 1: CrewManager mit start_crew() AsyncGenerator**

- Lädt Crew-Config aus YAML
- Für jeden Agent: MCP-Tools via MCPRegistry.list_tools() laden
- CrewAI Crew mit Agents + Tasks erstellen
- yield Events: execution_started, task_started, task_completed, execution_completed
- EventBroadcaster.publish() für jeden Event
- Optional: n8n Webhooks on_start, on_complete
- Optional: NocoDB crew_executions persistieren

**Step 2: CrewAI-Integration (minimal)**

```python
# Vereinfacht: Zuerst Mock-Execution, die Events yieldet
# Später: crewai.Crew, crew.kickoff_async()
async def start_crew(self, crew_id: str, inputs: dict) -> AsyncGenerator[dict, None]:
    execution_id = str(uuid.uuid4())
    yield {"type": "execution_started", "execution_id": execution_id, ...}
    # Mock: task_started, task_completed, execution_completed
    # Oder: crew.kickoff_async() mit Event-Hooks
```

**Step 3: Commit**

```bash
git add agent-backend/app/services/crew_manager.py
git commit -m "feat: add CrewManager with event streaming"
```

---

### Task 4.3: Crews Router (SSE)

**Files:**
- Create: `agent-backend/app/routers/crews.py`
- Modify: `agent-backend/app/main.py`

**Step 1: crews.py**

```python
# agent-backend/app/routers/crews.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio

router = APIRouter(prefix="/crews", tags=["crews"])

@router.get("/")
async def list_crews():
    # CrewConfig aus YAML laden
    ...

@router.post("/{crew_id}/start")
async def start_crew(crew_id: str, body: dict):
    # StreamingResponse (SSE)
    # CrewManager.start_crew() → EventBroadcaster.publish
    # Return execution_id sofort, SSE-Stream für Events
    ...

@router.get("/executions/{execution_id}")
async def stream_execution(execution_id: str):
    # SSE: EventBroadcaster.subscribe(execution_id)
    async def event_generator():
        async for msg in broadcaster.subscribe(execution_id):
            yield f"data: {msg}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/executions/{execution_id}/status")
async def execution_status(execution_id: str):
    # Aus Redis oder NocoDB
    ...
```

**Step 2: main.py**

```python
from app.routers import crews
app.include_router(crews.router)
```

**Step 3: Commit**

```bash
git add agent-backend/app/routers/crews.py agent-backend/app/main.py
git commit -m "feat: add crews router with SSE streaming"
```

---

## Etappe 5: Next.js Frontend

### Task 5.1: useCrewStream Hook

**Files:**
- Create: `dashboard-nextjs/src/hooks/useCrewStream.ts`

**Step 1: useCrewStream**

```typescript
// EventSource auf /api/crews/executions/{id} (oder Proxy zu Backend)
// State: events[], isConnected, execution, reconnect()
export function useCrewStream(executionId: string | null) {
  const [events, setEvents] = useState<Record<string, unknown>[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  useEffect(() => {
    if (!executionId) return;
    const es = new EventSource(`/api/crews/executions/${executionId}`);
    es.onopen = () => setIsConnected(true);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setEvents((prev) => [...prev, data]);
    };
    es.onerror = () => setIsConnected(false);
    return () => es.close();
  }, [executionId]);
  return { events, isConnected };
}
```

**Step 2: Commit**

```bash
git add dashboard-nextjs/src/hooks/useCrewStream.ts
git commit -m "feat: add useCrewStream hook"
```

---

### Task 5.2: CrewExecutionViewer Komponente

**Files:**
- Create: `dashboard-nextjs/src/components/CrewExecutionViewer.tsx`

**Step 1: CrewExecutionViewer**

- Props: executionId
- useCrewStream(executionId)
- Status-Header: Execution ID, Badge (running/completed/error)
- Task-Timeline: task_started, task_completed
- Raw Event Log (Terminal-Style, monospace)

**Step 2: Commit**

```bash
git add dashboard-nextjs/src/components/CrewExecutionViewer.tsx
git commit -m "feat: add CrewExecutionViewer component"
```

---

### Task 5.3: CrewLauncher Komponente

**Files:**
- Create: `dashboard-nextjs/src/components/CrewLauncher.tsx`

**Step 1: CrewLauncher**

- Fetch GET /crews/ → Crew-Liste
- Input-Felder aus Crew-Config (z.B. topic für research_crew)
- startCrew() → POST /crews/{id}/start mit inputs
- Response: execution_id
- onExecutionStart(executionId) → Wechsel zu CrewExecutionViewer

**Step 2: Commit**

```bash
git add dashboard-nextjs/src/components/CrewLauncher.tsx
git commit -m "feat: add CrewLauncher component"
```

---

### Task 5.4: Hauptseite und API-Proxy

**Files:**
- Modify: `dashboard-nextjs/src/app/page.tsx`
- Create: `dashboard-nextjs/next.config.js` (rewrites für /api → Backend)

**Step 1: next.config.js rewrites**

```javascript
// Proxy /api/* zu agent-backend
async rewrites() {
  return [
    { source: "/api/:path*", destination: "http://agent-backend:8000/:path*" }
  ];
}
```

**Step 2: page.tsx**

- CrewLauncher + CrewExecutionViewer (conditional auf executionId)
- Sidebar mit Service-Links (n8n, NocoDB, Grafana, …)

**Step 3: Commit**

```bash
git add dashboard-nextjs/src/app/page.tsx dashboard-nextjs/next.config.js
git commit -m "feat: wire CrewLauncher and CrewExecutionViewer on main page"
```

---

## Etappe 6: Docker & Integration

### Task 6.1: Docker Compose finalisieren

**Files:**
- Modify: `docker-compose.agent.yml`
- Create: `dashboard-nextjs/Dockerfile`

**Step 1: dashboard Dockerfile**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

**Step 2: docker-compose.agent.yml**

- Volumes für agent-logs, redis-data
- Environment-Variablen für Backend
- Network coolify (external)

**Step 3: Test**

```bash
docker compose -f docker-compose.agent.yml up --build
# http://localhost:3000 → Dashboard
# http://localhost:8000/health → Backend
```

**Step 4: Commit**

```bash
git add docker-compose.agent.yml dashboard-nextjs/Dockerfile
git commit -m "chore: finalize Docker Compose for full stack"
```

---

## Etappe 7: Erweiterungen (optional, nach DASHBOARD_ERWEITERUNG_IDEEN.md)

| Task | Inhalt | Priorität |
|------|--------|-----------|
| 7.1 | Services-Sidebar (Voice AI, Agents, Mailpit, AppFlowy, Hetzner S3) | Mittel |
| 7.2 | MCP-Health-Dashboard (Live-Status aller MCP-Server) | Hoch |
| 7.3 | Lead-Feed-Widget (NocoDB leads) | Mittel |
| 7.4 | Projekt-Kanban (NocoDB projekte) | Niedrig |
| 7.5 | Security-Check-Widget | Niedrig |

---

## Ausführungsoptionen

**Plan gespeichert unter:** `docs/plans/2026-03-08-agent-control-center.md`

**Zwei Ausführungsoptionen:**

1. **Subagent-Driven (diese Session)** — Frischer Subagent pro Task, Review zwischen Tasks, schnelle Iteration
2. **Parallele Session (separat)** — Neue Session mit executing-plans, Batch-Ausführung mit Checkpoints

**Welche Variante?**
