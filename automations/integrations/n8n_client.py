import httpx

from app.config import Settings


class N8NClient:
    def __init__(self, settings: Settings):
        self.base_url = (settings.n8n_api_url or "").rstrip("/")
        self.api_key = settings.n8n_api_key or ""
        self._headers = {
            "X-N8N-API-KEY": self.api_key,
            "Content-Type": "application/json",
        }

    def _enabled(self) -> bool:
        return bool(self.base_url and self.api_key)

    async def get_workflows(self) -> list:
        """Liste aller Workflows."""
        if not self._enabled():
            return []
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.get(
                    f"{self.base_url}/api/v1/workflows",
                    headers=self._headers,
                )
                r.raise_for_status()
                data = r.json()
                return data.get("data", data) if isinstance(data, dict) else data
        except Exception:
            return []

    async def get_executions(self, workflow_id: str | None = None) -> list:
        """Liste Executions, optional gefiltert nach workflow_id."""
        if not self._enabled():
            return []
        try:
            url = f"{self.base_url}/api/v1/executions"
            params = {}
            if workflow_id:
                params["workflowId"] = workflow_id
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.get(url, headers=self._headers, params=params)
                r.raise_for_status()
                data = r.json()
                return data.get("data", data) if isinstance(data, dict) else data
        except Exception:
            return []

    async def execute_workflow(
        self, workflow_id: str, data: dict | None = None
    ) -> dict:
        """Starte Workflow per API (falls Endpoint verfügbar)."""
        if not self._enabled():
            raise RuntimeError("n8n not configured")
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                f"{self.base_url}/api/v1/workflows/{workflow_id}/execute",
                headers=self._headers,
                json=data or {},
            )
            r.raise_for_status()
            return r.json()

    async def trigger_webhook(self, url: str, payload: dict) -> dict:
        """Triggere einen Webhook (z.B. n8n Webhook-Node)."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(url, json=payload)
            return {"status": r.status_code, "url": url}
