from pathlib import Path

import yaml
from fastapi import APIRouter, HTTPException

router = APIRouter()

_REGISTRY_ROOT = Path("/AIOS/ai-prompts-registry")


@router.get("/")
async def list_prompts():
    prompts = []
    if not _REGISTRY_ROOT.exists():
        return prompts
    for yaml_file in _REGISTRY_ROOT.rglob("*-agent.yaml"):
        with open(yaml_file) as f:
            data = yaml.safe_load(f)
        prompts.append({
            "id":          yaml_file.stem,
            "category":    yaml_file.parent.name,
            "name":        data.get("name", yaml_file.stem),
            "description": data.get("description", ""),
            "model":       data.get("model", {}).get("model_id", ""),
        })
    return prompts


@router.get("/{prompt_id}")
async def get_prompt(prompt_id: str):
    if not _REGISTRY_ROOT.exists():
        raise HTTPException(status_code=404, detail=f"Prompt '{prompt_id}' not found")
    for yaml_file in _REGISTRY_ROOT.rglob(f"{prompt_id}.yaml"):
        with open(yaml_file) as f:
            return yaml.safe_load(f)
    raise HTTPException(status_code=404, detail=f"Prompt '{prompt_id}' not found")
