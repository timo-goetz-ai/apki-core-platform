"""Jarvis API — HITL Orchestration Layer.

Endpoints:
    POST /api/jarvis/plan              — Intent → proposed_action (via Crew API)
    POST /api/jarvis/execute/{id}      — Execute approved task via Toolbox
    PATCH /api/jarvis/tasks/{id}/status — Update status (called by n8n callback)
    GET  /api/jarvis/tasks             — List tasks
    GET  /api/jarvis/health            — Toolbox health-check
"""

import json
import logging
from datetime import datetime

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.db import get_session
from app.models.jarvis_task import JarvisTask
from app.services.toolbox import Toolbox, ToolboxError

logger = logging.getLogger(__name__)
router = APIRouter()

_toolbox = Toolbox()  # Lädt infra/mcp-servers.json beim Import


# ── Pydantic Schemas ──────────────────────────────────────────────────────────

class PlanRequest(BaseModel):
    intent: str
    source: str = "telegram"
    tg_chat_id: str = ""


class StatusUpdate(BaseModel):
    status: str  # approved | aborted


# ── Helper: NocoDB Sync ───────────────────────────────────────────────────────

async def _sync_to_nocodb(task: JarvisTask) -> None:
    """Schreibt/aktualisiert einen Task in NocoDB (best-effort)."""
    if not settings.nocodb_api_token:
        return
    headers = {
        "xc-token": settings.nocodb_api_token,
        "Content-Type": "application/json",
    }
    payload = {
        "source": task.source,
        "intent": task.intent,
        "proposed_action": task.proposed_action,
        "mcp_server": task.mcp_server,
        "status": task.status,
        "tg_chat_id": task.tg_chat_id,
        "tg_msg_id": task.tg_msg_id,
        "audit_log": task.audit_log,
    }
    url = f"{settings.nocodb_base_url}/api/v1/db/data/noco/{settings.nocodb_jarvis_table_id}/jarvis_tasks"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(url, json=payload, headers=headers)
    except Exception as exc:
        logger.warning("NocoDB sync failed: %s", exc)


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/plan")
async def plan(req: PlanRequest, db: AsyncSession = Depends(get_session)):
    """Lässt Crew API den Plan erstellen und speichert als pending Task."""
    # 1. Crew API aufrufen
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{settings.crew_api_url}/api/v1/jarvis/plan",
                json={
                    "intent": req.intent,
                    "available_servers": _toolbox.list_servers(),
                },
                headers={"x-aios-token": settings.aios_token} if settings.aios_token else {},
            )
        if resp.status_code != 200:
            raise HTTPException(502, f"Crew API error: HTTP {resp.status_code}")
        plan_data = resp.json()
    except httpx.RequestError as exc:
        raise HTTPException(502, f"Crew API not reachable: {exc}")

    # 2. Task in PostgreSQL speichern
    task = JarvisTask(
        source=req.source,
        intent=req.intent,
        proposed_action=json.dumps(plan_data.get("proposed_action", plan_data)),
        mcp_server=plan_data.get("mcp_server", ""),
        status="pending",
        tg_chat_id=req.tg_chat_id,
        audit_log=f"[{datetime.utcnow().isoformat()}] plan created",
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    # 3. NocoDB sync (async, best-effort)
    await _sync_to_nocodb(task)

    return {
        "task_id": task.id,
        "status": task.status,
        "mcp_server": task.mcp_server,
        "proposed_action": plan_data,
    }


@router.post("/execute/{task_id}")
async def execute(task_id: int, db: AsyncSession = Depends(get_session)):
    """Führt einen approved Task via Toolbox aus."""
    task = await db.get(JarvisTask, task_id)
    if not task:
        raise HTTPException(404, f"Task {task_id} not found")
    if task.status != "approved":
        raise HTTPException(409, f"Task {task_id} status is '{task.status}', expected 'approved'")

    # Status: executing
    task.status = "executing"
    task.audit_log = (task.audit_log or "") + f"\n[{datetime.utcnow().isoformat()}] executing"
    await db.commit()

    # Tool-Call vorbereiten
    try:
        action = json.loads(task.proposed_action or "{}")
        result = await _toolbox.execute(
            server=task.mcp_server or action.get("mcp_server", ""),
            tool=action.get("tool", ""),
            params=action.get("params", {}),
            aios_token=settings.aios_token or None,
        )
        task.status = "completed"
        task.audit_log += f"\n[{datetime.utcnow().isoformat()}] completed: {json.dumps(result)[:500]}"
    except ToolboxError as exc:
        task.status = "failed"
        task.audit_log += f"\n[{datetime.utcnow().isoformat()}] failed (HTTP {exc.status_code}): {exc}"
        await db.commit()
        await _sync_to_nocodb(task)
        raise HTTPException(502, str(exc))

    await db.commit()
    await _sync_to_nocodb(task)
    return {"task_id": task_id, "status": task.status, "result": result}


@router.patch("/tasks/{task_id}/status")
async def update_status(task_id: int, body: StatusUpdate, db: AsyncSession = Depends(get_session)):
    """Aktualisiert den Status eines Tasks (z.B. approved/aborted durch n8n Callback)."""
    allowed = {"approved", "aborted"}
    if body.status not in allowed:
        raise HTTPException(400, f"status must be one of {allowed}")

    task = await db.get(JarvisTask, task_id)
    if not task:
        raise HTTPException(404, f"Task {task_id} not found")

    task.status = body.status
    task.audit_log = (task.audit_log or "") + f"\n[{datetime.utcnow().isoformat()}] {body.status}"
    await db.commit()
    await _sync_to_nocodb(task)
    return {"task_id": task_id, "status": task.status}


@router.get("/tasks")
async def list_tasks(
    status: str | None = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_session),
):
    """Listet Jarvis Tasks (optional nach Status gefiltert)."""
    q = select(JarvisTask).order_by(JarvisTask.id.desc()).limit(limit)
    if status:
        q = q.where(JarvisTask.status == status)
    result = await db.execute(q)
    tasks = result.scalars().all()
    return [
        {
            "id": t.id,
            "source": t.source,
            "intent": t.intent,
            "mcp_server": t.mcp_server,
            "status": t.status,
            "tg_chat_id": t.tg_chat_id,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        }
        for t in tasks
    ]


@router.get("/health")
async def toolbox_health():
    """Parallel-Health-Check aller MCP-Server."""
    results = await _toolbox.health_check()
    return {"servers": results, "total": len(results)}
