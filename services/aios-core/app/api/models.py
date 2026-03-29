from pathlib import Path

import yaml
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

_REGISTRY_ROOT = Path("/AIOS/ai-prompts-registry")
_FALLBACK_ROUTER = {
    "research":      {"model": "deepseek/deepseek-reasoner", "max_tokens": 16000, "temperature": 0.2},
    "coding":        {"model": "openai/gpt-4-turbo",         "max_tokens": 8000,  "temperature": 0.3},
    "documentation": {"model": "mistral/mistral-large",      "max_tokens": 6000,  "temperature": 0.2},
    "architecture":  {"model": "anthropic/claude-3.5-sonnet","max_tokens": 8000,  "temperature": 0.3},
    "automation":    {"model": "google/gemini-2.0-pro",      "max_tokens": 4000,  "temperature": 0.2},
}


def _load_router() -> dict:
    router_path = _REGISTRY_ROOT / "model-router.yaml"
    if router_path.exists():
        with open(router_path) as f:
            data = yaml.safe_load(f)
        return data.get("model_definitions", _FALLBACK_ROUTER)
    return _FALLBACK_ROUTER


class SelectRequest(BaseModel):
    task_type: str


@router.get("/")
async def list_models():
    return _load_router()


@router.post("/select")
async def select_model(req: SelectRequest):
    router_data = _load_router()
    if req.task_type not in router_data:
        raise HTTPException(status_code=400, detail=f"Unknown task_type: {req.task_type}")
    return {"task_type": req.task_type, **router_data[req.task_type]}
