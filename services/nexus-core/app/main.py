import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from app.api import agents, automations, models, prompts, tasks
from app.api import jarvis
from app.config.settings import settings
from app.db import init_db
from app.middleware.auth import AiosTokenMiddleware

logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)

REQUEST_COUNT = Counter("nexus_requests_total", "Total HTTP requests", ["method", "endpoint"])
REQUEST_LATENCY = Histogram("nexus_request_latency_seconds", "Request latency")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Nexus-Core starting – environment: %s", settings.environment)
    await init_db()
    logger.info("Database tables verified/created")
    yield
    logger.info("Nexus-Core shutting down")


app = FastAPI(
    title="Nexus-Core",
    description="Central AI orchestration backend — agents, tasks, models, automations",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(AiosTokenMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,   # via ALLOWED_ORIGINS env-var in Coolify
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "x-aios-token"],
)

app.include_router(agents.router,      prefix="/api/agents",      tags=["agents"])
app.include_router(tasks.router,       prefix="/api/tasks",       tags=["tasks"])
app.include_router(models.router,      prefix="/api/models",      tags=["models"])
app.include_router(prompts.router,     prefix="/api/prompts",     tags=["prompts"])
app.include_router(automations.router, prefix="/api/automations", tags=["automations"])
app.include_router(jarvis.router,      prefix="/api/jarvis",      tags=["jarvis"])


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "environment": settings.environment,
        "timestamp": datetime.now().isoformat(),
    }


@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    """Live-Updates für das Admin-Dashboard."""
    await websocket.accept()
    try:
        while True:
            agent_list = [{"id": k, **v} for k, v in agents._agents.items()]
            await websocket.send_json({
                "agents": agent_list,
                "tasks":  list(tasks._tasks.values())[-10:],
                "timestamp": datetime.now().isoformat(),
            })
            await asyncio.sleep(3)
    except Exception as exc:
        logger.debug("WebSocket closed: %s", exc)
    finally:
        await websocket.close()
