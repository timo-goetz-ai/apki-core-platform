"""Jarvis Planner — LLM-basierte Intent → proposed_action Konvertierung.

Endpoint:
    POST /api/v1/jarvis/plan
        Body: { "intent": str, "available_servers": list[str] }
        Returns: { "mcp_server": str, "tool": str, "params": dict, "description": str }
"""

import json
import logging

import httpx
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from app.config import Settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/jarvis", tags=["jarvis"])

_SYSTEM_PROMPT = """Du bist der Jarvis-Planner für ein AIOS-System.
Du bekommst einen natürlichsprachlichen Intent und eine Liste verfügbarer MCP-Server.
Erstelle einen strukturierten Aktionsplan als JSON mit folgenden Feldern:
- mcp_server: Name des passenden MCP-Servers aus der Liste
- tool: Name des spezifischen Tools (z.B. "deploy_application", "list_dns_records", "trigger_workflow")
- params: Dictionary mit den Tool-Parametern
- description: Kurze deutsche Beschreibung der geplanten Aktion (max. 100 Zeichen)
- is_readonly: true wenn die Aktion nur lesend ist (kein Approval nötig)

Antworte NUR mit validem JSON, keine Erklärungen."""


class PlanRequest(BaseModel):
    intent: str
    available_servers: list[str] = []


async def _call_gemini(intent: str, servers: list[str], api_key: str) -> dict:
    """Ruft Gemini 2.0 Flash direkt über die REST API auf."""
    prompt = (
        f"Verfügbare MCP-Server: {', '.join(servers)}\n\n"
        f"Intent: {intent}\n\n"
        "Erstelle den JSON-Aktionsplan:"
    )
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "systemInstruction": {"parts": [{"text": _SYSTEM_PROMPT}]},
        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 512},
    }
    url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"gemini-2.0-flash:generateContent?key={api_key}"
    )
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(url, json=payload)
    if resp.status_code != 200:
        raise HTTPException(502, f"Gemini API error: HTTP {resp.status_code}")

    text = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
    # Bereinige Markdown-Code-Blöcke falls vorhanden
    text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(text)


@router.post("/plan")
async def plan(req: PlanRequest, request: Request):
    """Konvertiert einen Intent in einen strukturierten MCP-Aktionsplan via Gemini."""
    settings: Settings = request.app.state.crew_manager.settings

    if not settings.gemini_api_key:
        raise HTTPException(503, "GEMINI_API_KEY not configured")

    try:
        result = await _call_gemini(req.intent, req.available_servers, settings.gemini_api_key)
    except json.JSONDecodeError as exc:
        raise HTTPException(502, f"Gemini returned invalid JSON: {exc}")
    except httpx.RequestError as exc:
        raise HTTPException(502, f"Gemini not reachable: {exc}")

    # Fallback-Validierung
    for field in ("mcp_server", "tool", "description"):
        if field not in result:
            raise HTTPException(502, f"Gemini response missing field '{field}'")

    result.setdefault("params", {})
    result.setdefault("is_readonly", False)
    return {"proposed_action": result, **result}
