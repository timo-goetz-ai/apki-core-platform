import asyncio
import uuid
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from app.services.crew_manager import CrewManager
from app.services.event_stream import EventBroadcaster

router = APIRouter(prefix="/crews", tags=["crews"])


def _get_broadcaster(request: Request) -> EventBroadcaster:
    return request.app.state.broadcaster


def _get_crew_manager(request: Request) -> CrewManager:
    return request.app.state.crew_manager


@router.get("/")
async def list_crews(request: Request):
    """Liste aller konfigurierten Crews."""
    cm = _get_crew_manager(request)
    return cm.list_crews()


@router.post("/{crew_id}/start")
async def start_crew(crew_id: str, request: Request):
    """Startet Crew, gibt execution_id zurück. Client subscribt via GET /crews/executions/{id}."""
    cm = _get_crew_manager(request)
    try:
        inputs = await request.json()
    except Exception:
        inputs = {}

    crew = cm.get_crew(crew_id)
    if not crew:
        raise HTTPException(status_code=404, detail=f"Crew {crew_id} not found")

    execution_id = str(uuid.uuid4())
    asyncio.create_task(_run_crew(cm, crew_id, inputs, execution_id))
    return {"execution_id": execution_id, "crew_id": crew_id}


async def _run_crew(cm: CrewManager, crew_id: str, inputs: dict, execution_id: str):
    """Führt Crew aus (Background). Events werden via Redis publiziert."""
    try:
        async for _ in cm.start_crew(crew_id, inputs, execution_id):
            pass
    except Exception:
        pass


@router.get("/executions/{execution_id}")
async def stream_execution(execution_id: str, request: Request):
    """SSE-Stream für Execution-Events."""
    broadcaster = _get_broadcaster(request)

    async def event_generator():
        async for msg in broadcaster.subscribe(execution_id):
            yield f"data: {msg}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/{crew_id}/run")
async def run_crew_sync(crew_id: str, request: Request):
    """Synchroner Crew-Run — wartet bis zur Completion, gibt Ergebnis als JSON zurück.
    Ideal für n8n-Integration (kein SSE nötig, bis zu 3 Min Timeout einplanen).
    Body: { "inputs": { "topic": "...", "category": "...", ... } }
    """
    cm = _get_crew_manager(request)
    crew = cm.get_crew(crew_id)
    if not crew:
        raise HTTPException(status_code=404, detail=f"Crew '{crew_id}' nicht gefunden")

    try:
        body = await request.json()
    except Exception:
        body = {}

    inputs = body.get("inputs", body)
    execution_id = str(uuid.uuid4())
    result_text = ""
    error_text = ""
    task_outputs: list[dict] = []

    async for event in cm.start_crew(crew_id, inputs, execution_id):
        if event.get("type") == "task_completed":
            task_outputs.append({
                "task_id": event.get("task_id"),
                "agent_id": event.get("agent_id"),
                "output": event.get("output", ""),
            })
        elif event.get("type") == "execution_completed":
            result_text = event.get("result", "")
        elif event.get("type") == "execution_error":
            error_text = event.get("error", "")

    if error_text:
        raise HTTPException(status_code=500, detail=error_text)

    return {
        "execution_id": execution_id,
        "crew_id": crew_id,
        "result": result_text,
        "task_outputs": task_outputs,
    }


@router.get("/executions/{execution_id}/status")
async def execution_status(execution_id: str):
    """Status einer Execution (Platzhalter – später Redis/NocoDB)."""
    return {"execution_id": execution_id, "status": "unknown"}
