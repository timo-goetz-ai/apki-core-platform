import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware

from app.api import agents, models, prompts, tasks, automations
from app.config.settings import settings

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

# ── In-memory state (wird später durch Redis/DB ersetzt) ──────────────────────
_active_agents: list[dict] = [
    {"id": "research-agent",  "name": "Research Agent",       "status": "idle",  "model": "deepseek/deepseek-reasoner"},
    {"id": "dev-agent",       "name": "Dev Agent",            "status": "idle",  "model": "openai/gpt-4-turbo"},
    {"id": "docs-agent",      "name": "Docs Agent",           "status": "idle",  "model": "mistral/mistral-large"},
    {"id": "infra-agent",     "name": "Infrastructure Agent", "status": "idle",  "model": "google/gemini-2.0-pro"},
    {"id": "storage-guardian","name": "Storage Guardian",     "status": "idle",  "model": "anthropic/claude-3.5-sonnet"},
]
_pending_tasks: list[dict] = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("AI Control Center starting up – environment: %s", settings.environment)
    yield
    logger.info("AI Control Center shutting down")


app = FastAPI(
    title="AI Control Center",
    description="Central orchestration for AI agents, models, tasks and automations",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents.router,      prefix="/api/agents",      tags=["agents"])
app.include_router(models.router,      prefix="/api/models",      tags=["models"])
app.include_router(prompts.router,     prefix="/api/prompts",     tags=["prompts"])
app.include_router(tasks.router,       prefix="/api/tasks",       tags=["tasks"])
app.include_router(automations.router, prefix="/api/automations", tags=["automations"])


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.environment,
        "agents_registered": len(_active_agents),
        "tasks_pending": len(_pending_tasks),
        "timestamp": datetime.now().isoformat(),
    }


@app.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            await websocket.send_json({
                "agents": _active_agents,
                "tasks": _pending_tasks,
                "timestamp": datetime.now().isoformat(),
            })
            await asyncio.sleep(5)
    except Exception as exc:
        logger.warning("WebSocket closed: %s", exc)
    finally:
        await websocket.close()
