import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

_N8N_BASE = "https://n8n.automation-plus-ki.de"


class WebhookTrigger(BaseModel):
    workflow_name: str
    payload: dict = {}


@router.post("/trigger")
async def trigger_n8n_webhook(req: WebhookTrigger):
    """Triggert einen n8n-Webhook-Workflow über HTTP."""
    url = f"{_N8N_BASE}/webhook/{req.workflow_name}"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=req.payload)
        return {"status": "triggered", "n8n_status": resp.status_code, "response": resp.text[:500]}
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"n8n not reachable: {exc}")


@router.get("/")
async def list_automations():
    return [
        {"id": "ai-task-orchestration", "description": "Triggers research/dev/infra agent via task_type"},
        {"id": "model-router-flow",     "description": "Auto-selects best model for given task"},
        {"id": "github-deploy-flow",    "description": "Deploys via Coolify on GitHub push"},
        {"id": "intake-flow",           "description": "Scans INPUT_GLOBAL, classifies and routes files"},
    ]
