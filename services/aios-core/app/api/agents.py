import asyncio
import uuid
from datetime import datetime

from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

router = APIRouter()

_agents: dict[str, dict] = {
    "research-agent":   {"name": "Research Agent",       "model": "deepseek/deepseek-reasoner", "status": "idle"},
    "dev-agent":        {"name": "Dev Agent",            "model": "openai/gpt-4-turbo",         "status": "idle"},
    "docs-agent":       {"name": "Docs Agent",           "model": "mistral/mistral-large",      "status": "idle"},
    "infra-agent":      {"name": "Infrastructure Agent", "model": "google/gemini-2.0-pro",      "status": "idle"},
    "storage-guardian": {"name": "Storage Guardian",     "model": "anthropic/claude-3.5-sonnet","status": "idle"},
}
_runs: list[dict] = []


class ExecuteRequest(BaseModel):
    agent_id: str
    task_description: str
    parameters: dict = {}
    urgency: str = "normal"


@router.get("/")
async def list_agents():
    return [{"id": k, **v} for k, v in _agents.items()]


@router.post("/execute")
async def execute_agent(req: ExecuteRequest, background_tasks: BackgroundTasks):
    if req.agent_id not in _agents:
        raise HTTPException(status_code=404, detail=f"Agent '{req.agent_id}' not found")

    task_id = str(uuid.uuid4())
    run = {
        "task_id":     task_id,
        "agent_id":    req.agent_id,
        "description": req.task_description,
        "status":      "queued",
        "created_at":  datetime.now().isoformat(),
    }
    _runs.append(run)
    _agents[req.agent_id]["status"] = "running"

    async def _run_agent():
        await asyncio.sleep(2)
        run["status"] = "completed"
        run["completed_at"] = datetime.now().isoformat()
        _agents[req.agent_id]["status"] = "idle"

    background_tasks.add_task(_run_agent)
    return {"task_id": task_id, "status": "queued"}


@router.get("/{agent_id}/status")
async def agent_status(agent_id: str):
    if agent_id not in _agents:
        raise HTTPException(status_code=404, detail="Agent not found")
    runs = [r for r in _runs if r["agent_id"] == agent_id]
    return {**_agents[agent_id], "id": agent_id, "total_runs": len(runs), "runs": runs[-5:]}
