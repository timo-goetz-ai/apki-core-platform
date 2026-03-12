import time
import yaml
import httpx
from pathlib import Path
from typing import Any


class MCPRegistry:
    def __init__(self, config_path: str | Path | None = None):
        if config_path is None:
            config_path = Path(__file__).resolve().parent.parent.parent / "config" / "mcp_servers.yaml"
        self.config_path = Path(config_path)
        self._servers: list[dict] = []
        self._load_config()

    def _load_config(self):
        if not self.config_path.exists():
            self._servers = []
            return
        with open(self.config_path) as f:
            data = yaml.safe_load(f)
            self._servers = data.get("servers", [])

    def get_server(self, server_id: str) -> dict | None:
        for s in self._servers:
            if s.get("id") == server_id:
                return s
        return None

    def list_servers(self) -> list[dict]:
        return self._servers.copy()

    def _get_endpoint(self, server_id: str) -> str | None:
        s = self.get_server(server_id)
        if not s:
            return None
        return s.get("url", "").rstrip("/")

    async def check_health(self, server_id: str) -> tuple[bool, float]:
        """Returns (is_healthy, latency_ms)."""
        base = self._get_endpoint(server_id)
        if not base:
            return False, 0.0
        start = time.perf_counter()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                r = await client.post(
                    f"{base}/mcp",
                    json={
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "initialize",
                        "params": {
                            "protocolVersion": "2024-11-05",
                            "capabilities": {},
                            "clientInfo": {"name": "agent-backend", "version": "0.1.0"},
                        },
                    },
                    headers={"Content-Type": "application/json"},
                )
                ok = r.status_code == 200 and "result" in (r.json() or {})
        except Exception:
            ok = False
        latency_ms = (time.perf_counter() - start) * 1000
        return ok, round(latency_ms, 2)

    async def list_tools(self, server_id: str) -> list[dict]:
        base = self._get_endpoint(server_id)
        if not base:
            return []
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                r = await client.post(
                    f"{base}/mcp",
                    json={
                        "jsonrpc": "2.0",
                        "id": 2,
                        "method": "tools/list",
                        "params": {},
                    },
                    headers={"Content-Type": "application/json"},
                )
                data = r.json() or {}
                if "result" in data and "tools" in data["result"]:
                    return data["result"]["tools"]
                return []
        except Exception:
            return []

    async def call_tool(self, server_id: str, tool_name: str, arguments: dict) -> Any:
        base = self._get_endpoint(server_id)
        if not base:
            raise ValueError(f"Server {server_id} not found")
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(
                f"{base}/mcp",
                json={
                    "jsonrpc": "2.0",
                    "id": 3,
                    "method": "tools/call",
                    "params": {"name": tool_name, "arguments": arguments or {}},
                },
                headers={"Content-Type": "application/json"},
            )
            data = r.json() or {}
            if "error" in data:
                raise RuntimeError(data["error"].get("message", str(data["error"])))
            return data.get("result", {})

    async def health_check_all(self) -> list[dict]:
        results = []
        for s in self._servers:
            sid = s.get("id", "")
            is_healthy, latency_ms = await self.check_health(sid)
            tools = await self.list_tools(sid) if is_healthy else []
            results.append(
                {
                    "id": sid,
                    "name": s.get("name", sid),
                    "is_healthy": is_healthy,
                    "latency_ms": latency_ms,
                    "tool_count": len(tools),
                }
            )
        return results
