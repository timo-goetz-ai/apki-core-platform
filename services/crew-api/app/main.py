from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import Settings
from app.services.crew_manager import CrewManager
from app.services.event_stream import EventBroadcaster

settings = Settings()
broadcaster = EventBroadcaster(settings.redis_url)
crew_manager = CrewManager(broadcaster, settings=settings)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await broadcaster.connect()
    app.state.broadcaster = broadcaster
    app.state.crew_manager = crew_manager
    yield
    await broadcaster.disconnect()


app = FastAPI(lifespan=lifespan)

from app.routers import crews, mcp

app.include_router(mcp.router)
app.include_router(crews.router)


@app.get("/health")
async def health():
    return {"status": "ok", "redis": "connected"}
