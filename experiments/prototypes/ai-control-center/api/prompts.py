from pathlib import Path
from fastapi import APIRouter, HTTPException
import yaml

router = APIRouter()

_REGISTRY_ROOT = Path(__file__).parents[3] / "ai-prompts-registry"


@router.get("/")
async def list_prompts():
    prompts = []
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
    for yaml_file in _REGISTRY_ROOT.rglob(f"{prompt_id}.yaml"):
        with open(yaml_file) as f:
            return yaml.safe_load(f)
    raise HTTPException(status_code=404, detail=f"Prompt '{prompt_id}' not found")
