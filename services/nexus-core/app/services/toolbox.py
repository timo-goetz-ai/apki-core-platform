"""Toolbox — dynamischer MCP-Client für alle 17 registrierten Server."""

import asyncio
import json
import logging
import os
from pathlib import Path

import httpx

logger = logging.getLogger(__name__)

_RETRY_DELAYS = (1.0, 3.0, 9.0)  # Sekunden (exponentieller Backoff)
_TIMEOUT_INTERNAL = 15.0
_TIMEOUT_EXTERNAL = 30.0


class ToolboxError(Exception):
    def __init__(self, message: str, status_code: int | None = None):
        super().__init__(message)
        self.status_code = status_code


class Toolbox:

    @staticmethod
    def _default_mcp_config_path() -> Path:
        """Monorepo (parents[4]) vs. Docker: /app + infra unter /app/infra."""
        here = Path(__file__).resolve()
        env = os.environ.get("MCP_SERVERS_CONFIG")
        if env:
            return Path(env)
        docker_candidate = here.parents[2] / "infra" / "mcp-servers.json"
        if docker_candidate.exists():
            return docker_candidate
        return here.parents[4] / "infra" / "mcp-servers.json"

    def __init__(self, config_path: str | Path | None = None):
        if config_path is None:
            config_path = self._default_mcp_config_path()
        self._servers: dict[str, dict] = {}
        self._circuit_failures: dict[str, int] = {}
        self._load(Path(config_path))

    def _load(self, path: Path) -> None:
        if not path.exists():
            logger.warning("mcp-servers.json not found at %s", path)
            return
        with open(path) as f:
            data = json.load(f)
        self._servers = data.get("mcpServers", {})
        logger.info("Toolbox loaded %d MCP servers", len(self._servers))

    def list_servers(self) -> list[str]:
        return list(self._servers.keys())

    def get_server_url(self, server: str) -> str | None:
        entry = self._servers.get(server)
        return entry["url"] if entry else None

    async def execute(
        self,
        server: str,
        tool: str,
        params: dict,
        aios_token: str | None = None,
    ) -> dict:
        """Führt einen MCP-Tool-Call mit Retry-Logic aus."""
        entry = self._servers.get(server)
        if not entry:
            raise ToolboxError(f"Unknown MCP server: {server}")

        # Circuit Breaker: nach 3 konsekutiven Fehlern blockieren
        if self._circuit_failures.get(server, 0) >= 3:
            raise ToolboxError(f"Circuit open for {server} — too many failures")

        url = entry["url"].rstrip("/") + f"/tools/{tool}"
        is_internal = "10.0.1." in url or "localhost" in url
        timeout = _TIMEOUT_INTERNAL if is_internal else _TIMEOUT_EXTERNAL

        headers = {"Content-Type": "application/json"}
        if aios_token:
            headers["x-aios-token"] = aios_token

        last_exc: Exception | None = None
        for attempt, delay in enumerate(_RETRY_DELAYS, start=1):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    resp = await client.post(url, json=params, headers=headers)

                if resp.status_code >= 500:
                    raise ToolboxError(
                        f"{server}/{tool} returned HTTP {resp.status_code}",
                        status_code=resp.status_code,
                    )

                self._circuit_failures[server] = 0  # Reset bei Erfolg
                return resp.json()

            except httpx.TimeoutException:
                # Exit Code 28 Äquivalent: Timeout
                last_exc = ToolboxError(
                    f"{server}/{tool} timed out after {timeout}s (attempt {attempt}/3)",
                    status_code=28,
                )
                logger.warning("%s", last_exc)
            except httpx.RequestError as exc:
                last_exc = ToolboxError(
                    f"{server}/{tool} connection error: {exc} (attempt {attempt}/3)",
                )
                logger.warning("%s", last_exc)
            except ToolboxError:
                raise

            if attempt < len(_RETRY_DELAYS):
                await asyncio.sleep(delay)

        self._circuit_failures[server] = self._circuit_failures.get(server, 0) + 1
        raise last_exc or ToolboxError(f"{server}/{tool} failed after 3 attempts")

    async def health_check(self) -> dict[str, str]:
        """Parallel-Health-Check aller registrierten Server."""
        async def _check(name: str, url: str) -> tuple[str, str]:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    r = await client.get(url.rstrip("/") + "/health")
                return name, f"HTTP {r.status_code}"
            except httpx.TimeoutException:
                return name, "TIMEOUT (28)"
            except Exception as exc:
                return name, f"ERROR: {exc}"

        tasks = [_check(name, entry["url"]) for name, entry in self._servers.items()]
        results = await asyncio.gather(*tasks)
        return dict(results)
