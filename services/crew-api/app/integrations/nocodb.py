import httpx

from app.config import Settings


class NocoDBClient:
    def __init__(self, settings: Settings):
        self.base_url = (settings.nocodb_api_url or "").rstrip("/")
        self.token = settings.nocodb_api_token or ""
        self._headers = {"xc-auth": self.token, "Content-Type": "application/json"}

    def _enabled(self) -> bool:
        return bool(self.base_url and self.token)

    async def list_bases(self) -> list:
        """Liste aller Bases (Workspaces)."""
        if not self._enabled():
            return []
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.get(
                    f"{self.base_url}/api/v2/meta/bases",
                    headers=self._headers,
                )
                r.raise_for_status()
                data = r.json()
                return data.get("list", data) if isinstance(data, dict) else data
        except Exception:
            return []

    async def list_tables(self, base_id: str | None = None) -> list:
        """Liste Tabellen. Ohne base_id: erste Base verwenden."""
        if not self._enabled():
            return []
        try:
            if not base_id:
                bases = await self.list_bases()
                if not bases:
                    return []
                base_id = bases[0].get("id", bases[0].get("base_id", ""))
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.get(
                    f"{self.base_url}/api/v2/meta/bases/{base_id}/tables",
                    headers=self._headers,
                )
                r.raise_for_status()
                data = r.json()
                return data.get("list", data) if isinstance(data, dict) else data
        except Exception:
            return []

    async def list_records(
        self, table_id: str, params: dict | None = None
    ) -> list:
        """Liste Records einer Tabelle."""
        if not self._enabled():
            return []
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.get(
                    f"{self.base_url}/api/v2/tables/{table_id}/records",
                    headers=self._headers,
                    params=params or {},
                )
                r.raise_for_status()
                data = r.json()
                return data.get("list", data) if isinstance(data, dict) else data
        except Exception:
            return []

    async def create_record(self, table_id: str, data: dict) -> dict:
        """Erstelle einen Record."""
        if not self._enabled():
            raise RuntimeError("NocoDB not configured")
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.post(
                f"{self.base_url}/api/v2/tables/{table_id}/records",
                headers=self._headers,
                json=data,
            )
            r.raise_for_status()
            return r.json()

    async def update_record(
        self, table_id: str, record_id: str, data: dict
    ) -> dict:
        """Aktualisiere einen Record."""
        if not self._enabled():
            raise RuntimeError("NocoDB not configured")
        async with httpx.AsyncClient(timeout=15.0) as client:
            r = await client.patch(
                f"{self.base_url}/api/v2/tables/{table_id}/records/{record_id}",
                headers=self._headers,
                json=data,
            )
            r.raise_for_status()
            return r.json()
