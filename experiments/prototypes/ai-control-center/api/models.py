import yaml
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

_ROUTER_PATH = Path(__file__).parents[3] / "ai-prompts-registry" / "model-router.yaml"

_fallback_router = {
    "research":      {"model": "deepseek/deepseek-reasoner", "max_tokens": 16000, "temperature": 0.2},
    "coding":        {"model": "openai/gpt-4-turbo",         "max_tokens": 8000,  "temperature": 0.3},
    "documentation": {"model": "mistral/mistral-large",      "max_tokens": 6000,  "temperature": 0.2},
    "architecture":  {"model": "anthropic/claude-3.5-sonnet","max_tokens": 8000,  "temperature": 0.3},
    "automation":    {"model": "google/gemini-2.0-pro",      "max_tokens": 4000,  "temperature": 0.2},
}


def _load_router() -> dict:
    if _ROUTER_PATH.exists():
        with open(_ROUTER_PATH) as f:
            data = yaml.safe_load(f)
        return data.get("model_definitions", _fallback_router)
    return _fallback_router


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
