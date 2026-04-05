"""HTTP API clients for n8n, Directus, Prometheus, and Coolify."""
from __future__ import annotations

import os
from datetime import datetime, timezone, timedelta

import httpx

# ─── Config ───────────────────────────────────────────────────────────────────
N8N_BASE_URL    = os.environ.get("N8N_BASE_URL", "http://homestack-n8n:5678")
N8N_API_KEY     = os.environ.get("N8N_API_KEY", "")
DIRECTUS_URL    = os.environ.get("DIRECTUS_URL", "https://directus.automation-plus-ki.de")
DIRECTUS_TOKEN  = os.environ.get("DIRECTUS_TOKEN", "")
PROM_BASE_URL   = os.environ.get("PROMETHEUS_BASE_URL", "http://homestack-prometheus:9090")
COOLIFY_BASE    = os.environ.get("COOLIFY_BASE_URL", "https://coolify.automation-plus-ki.de")
COOLIFY_TOKEN   = os.environ.get("COOLIFY_API_TOKEN", "")
JARVIS_WEBHOOK  = os.environ.get("JARVIS_WEBHOOK_URL", "https://n8n.automation-plus-ki.de/webhook/jarvis-intent")

TIMEOUT = httpx.Timeout(12.0)

# ─── Directus Collection Names ────────────────────────────────────────────────
COLL_TRENDS           = "300_trends"
COLL_SENTIMENT        = "310_sentiment"
COLL_CONTENT_OPP      = "320_content_opportunities"
COLL_CONTENT_PIPELINE = "400_content_pipeline"
COLL_PROMPTS          = "200_prompts"
COLL_WORKFLOWS_REG    = "100_workflows"


# ─── n8n ──────────────────────────────────────────────────────────────────────

async def get_n8n_workflows(client: httpx.AsyncClient) -> list[dict]:
    """Return all n8n workflows."""
    r = await client.get(
        f"{N8N_BASE_URL}/api/v1/workflows",
        headers={"X-N8N-API-KEY": N8N_API_KEY},
        params={"limit": 100},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return r.json().get("data", [])


async def get_n8n_executions(client: httpx.AsyncClient, limit: int = 100) -> list[dict]:
    """Return recent n8n executions."""
    r = await client.get(
        f"{N8N_BASE_URL}/api/v1/executions",
        headers={"X-N8N-API-KEY": N8N_API_KEY},
        params={"limit": limit},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return r.json().get("data", [])


async def get_n8n_error_executions(client: httpx.AsyncClient, days: int = 7) -> list[dict]:
    """Return executions with error status from the last N days."""
    executions = await get_n8n_executions(client, limit=200)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    result = []
    for e in executions:
        if e.get("status") not in ("error", "failed", "crashed"):
            continue
        started = e.get("startedAt") or e.get("createdAt", "")
        if started:
            try:
                dt = datetime.fromisoformat(started.replace("Z", "+00:00"))
                if dt > cutoff:
                    result.append(e)
            except ValueError:
                result.append(e)
    return result


async def activate_n8n_workflow(client: httpx.AsyncClient, workflow_id: str) -> dict:
    r = await client.post(
        f"{N8N_BASE_URL}/api/v1/workflows/{workflow_id}/activate",
        headers={"X-N8N-API-KEY": N8N_API_KEY},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return r.json()


async def deactivate_n8n_workflow(client: httpx.AsyncClient, workflow_id: str) -> dict:
    r = await client.post(
        f"{N8N_BASE_URL}/api/v1/workflows/{workflow_id}/deactivate",
        headers={"X-N8N-API-KEY": N8N_API_KEY},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return r.json()


async def run_n8n_workflow(client: httpx.AsyncClient, workflow_id: str) -> dict:
    r = await client.post(
        f"{N8N_BASE_URL}/api/v1/workflows/{workflow_id}/run",
        headers={"X-N8N-API-KEY": N8N_API_KEY},
        json={},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return r.json()


def calc_execution_stats(executions: list[dict], hours: int = 24) -> dict:
    """Calculate 24h execution stats from a list of executions."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    recent = []
    for e in executions:
        started = e.get("startedAt") or e.get("createdAt", "")
        if started:
            try:
                dt = datetime.fromisoformat(started.replace("Z", "+00:00"))
                if dt > cutoff:
                    recent.append(e)
            except ValueError:
                pass
    success = sum(1 for e in recent if e.get("status") == "success")
    errors  = sum(1 for e in recent if e.get("status") in ("error", "failed", "crashed"))
    runtimes = []
    for e in recent:
        if e.get("startedAt") and e.get("stoppedAt") and e.get("status") == "success":
            try:
                s = datetime.fromisoformat(e["startedAt"].replace("Z", "+00:00"))
                t = datetime.fromisoformat(e["stoppedAt"].replace("Z", "+00:00"))
                runtimes.append((t - s).total_seconds())
            except (ValueError, KeyError):
                pass
    avg_rt = round(sum(runtimes) / len(runtimes), 1) if runtimes else None
    return {"total": len(recent), "success": success, "errors": errors, "avg_runtime_s": avg_rt}


# ─── Prometheus ───────────────────────────────────────────────────────────────

async def get_prometheus_alerts(client: httpx.AsyncClient) -> list[dict]:
    """Return currently firing Prometheus alerts."""
    r = await client.get(f"{PROM_BASE_URL}/api/v1/alerts", timeout=TIMEOUT)
    r.raise_for_status()
    all_alerts = r.json().get("data", {}).get("alerts", [])
    return [a for a in all_alerts if a.get("state") == "firing"]


async def query_prometheus(client: httpx.AsyncClient, promql: str) -> dict:
    """Run an instant PromQL query."""
    r = await client.get(
        f"{PROM_BASE_URL}/api/v1/query",
        params={"query": promql},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return r.json().get("data", {})


# ─── Directus ────────────────────────────────────────────────────────────────

async def get_directus_rows(
    client: httpx.AsyncClient,
    collection: str,
    limit: int = 5,
    sort: str = "-date_created",
) -> list[dict]:
    """Fetch rows from a Directus collection."""
    url = f"{DIRECTUS_URL}/items/{collection}"
    r = await client.get(
        url,
        headers={"Authorization": f"Bearer {DIRECTUS_TOKEN}"},
        params={"limit": limit, "sort": sort},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return r.json().get("data", [])


async def count_directus_rows(client: httpx.AsyncClient, collection: str) -> int:
    """Return total row count of a Directus collection."""
    url = f"{DIRECTUS_URL}/items/{collection}"
    r = await client.get(
        url,
        headers={"Authorization": f"Bearer {DIRECTUS_TOKEN}"},
        params={"limit": 0, "meta": "total_count"},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    data = r.json()
    return data.get("meta", {}).get("total_count", 0)


# ─── Coolify ──────────────────────────────────────────────────────────────────

async def get_coolify_applications(client: httpx.AsyncClient) -> list[dict]:
    """Return all Coolify applications + services."""
    if not COOLIFY_TOKEN:
        raise RuntimeError("COOLIFY_API_TOKEN nicht gesetzt")
    r = await client.get(
        f"{COOLIFY_BASE}/api/v1/applications",
        headers={"Authorization": f"Bearer {COOLIFY_TOKEN}"},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    data = r.json()
    # Coolify returns either a list or {data: [...]}
    if isinstance(data, list):
        return data
    return data.get("data", [])


async def trigger_jarvis_plan(
    client: httpx.AsyncClient,
    intent: str,
    tg_chat_id: str,
    source: str = "telegram",
) -> dict:
    """Schickt einen Intent an den Jarvis Approval-Workflow in n8n."""
    r = await client.post(
        JARVIS_WEBHOOK,
        json={"intent": intent, "tg_chat_id": tg_chat_id, "source": source},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return r.json()


async def get_coolify_deployment_logs(
    client: httpx.AsyncClient, app_id: str, limit: int = 5
) -> list[dict]:
    """Return recent deployments for a Coolify application."""
    if not COOLIFY_TOKEN:
        raise RuntimeError("COOLIFY_API_TOKEN nicht gesetzt")
    r = await client.get(
        f"{COOLIFY_BASE}/api/v1/applications/{app_id}/deployments",
        headers={"Authorization": f"Bearer {COOLIFY_TOKEN}"},
        params={"take": limit},
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    data = r.json()
    if isinstance(data, list):
        return data[:limit]
    return data.get("data", [])[:limit]


# ─── Conversational AI (n8n Memory Workflow) ─────────────────────────────────

CHAT_MEMORY_WEBHOOK = os.environ.get(
    "CHAT_MEMORY_WEBHOOK_URL",
    "https://n8n.automation-plus-ki.de/webhook/chat-memory",
)


async def send_to_conversational_ai(
    client: httpx.AsyncClient,
    chat_id: str,
    user_name: str,
    message: str,
) -> str:
    """Route message to the 555_CONVERSATIONAL_AI n8n workflow with persistent memory."""
    try:
        resp = await client.post(
            CHAT_MEMORY_WEBHOOK,
            json={"chat_id": chat_id, "user_name": user_name, "message": message},
            timeout=35.0,
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("response", "Keine Antwort erhalten.")
    except httpx.TimeoutException:
        return "⏱ Die Antwort hat zu lange gedauert. Bitte versuche es erneut."
    except Exception as exc:
        return f"❌ AI nicht erreichbar: {exc}"
