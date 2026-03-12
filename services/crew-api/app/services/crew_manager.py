import asyncio
import uuid
import yaml
from collections.abc import AsyncGenerator
from pathlib import Path

from app.integrations.n8n import N8NClient
from app.models.crew import CrewConfig
from app.models.events import (
    ExecutionCompletedEvent,
    ExecutionErrorEvent,
    ExecutionStartedEvent,
    TaskCompletedEvent,
    TaskStartedEvent,
)
from app.services.event_stream import EventBroadcaster
from app.config import Settings


class CrewManager:
    def __init__(
        self,
        broadcaster: EventBroadcaster,
        config_path: str | Path | None = None,
        settings: Settings | None = None,
    ):
        self.broadcaster = broadcaster
        if config_path is None:
            config_path = Path(__file__).resolve().parent.parent.parent / "config" / "crews.yaml"
        self.config_path = Path(config_path)
        self.settings = settings or Settings()
        self._crews: dict[str, CrewConfig] = {}
        self._load_config()

    def _load_config(self):
        if not self.config_path.exists():
            self._crews = {}
            return
        with open(self.config_path) as f:
            data = yaml.safe_load(f)
            crews_raw = data.get("crews", {})
            for cid, cdata in crews_raw.items():
                self._crews[cid] = CrewConfig(**cdata)

    def list_crews(self) -> list[dict]:
        return [
            {"id": cid, "name": c.name, "agents": len(c.agents), "tasks": len(c.tasks)}
            for cid, c in self._crews.items()
        ]

    def get_crew(self, crew_id: str) -> CrewConfig | None:
        return self._crews.get(crew_id)

    async def start_crew(
        self, crew_id: str, inputs: dict, execution_id: str | None = None
    ) -> AsyncGenerator[dict, None]:
        """Startet Crew-Execution, publiziert Events via Redis, yieldet Events."""
        crew = self.get_crew(crew_id)
        if not crew:
            raise ValueError(f"Crew {crew_id} not found")

        execution_id = execution_id or str(uuid.uuid4())
        webhooks = crew.webhooks or {}
        on_start = webhooks.get("on_start", "")
        on_complete = webhooks.get("on_complete", "")

        # Optional: n8n on_start Webhook
        if on_start:
            try:
                n8n = N8NClient(self.settings)
                await n8n.trigger_webhook(
                    on_start,
                    {"execution_id": execution_id, "crew_id": crew_id, "inputs": inputs},
                )
            except Exception:
                pass

        # execution_started
        ev_start = ExecutionStartedEvent(
            execution_id=execution_id, crew_id=crew_id
        )
        await self.broadcaster.publish(execution_id, ev_start)
        yield ev_start.model_dump()

        try:
            for task in crew.tasks:
                # task_started
                ev_ts = TaskStartedEvent(
                    execution_id=execution_id,
                    task_id=task.id,
                    agent_id=task.agent_id,
                )
                await self.broadcaster.publish(execution_id, ev_ts)
                yield ev_ts.model_dump()

                # Mock: kurze Verzögerung, dann task_completed
                await asyncio.sleep(0.5)
                ev_tc = TaskCompletedEvent(
                    execution_id=execution_id,
                    task_id=task.id,
                    agent_id=task.agent_id,
                    output=f"Mock output for {task.id}",
                )
                await self.broadcaster.publish(execution_id, ev_tc)
                yield ev_tc.model_dump()

            # execution_completed
            ev_done = ExecutionCompletedEvent(execution_id=execution_id)
            await self.broadcaster.publish(execution_id, ev_done)
            yield ev_done.model_dump()

            # Optional: n8n on_complete Webhook
            if on_complete:
                try:
                    n8n = N8NClient(self.settings)
                    await n8n.trigger_webhook(
                        on_complete,
                        {"execution_id": execution_id, "crew_id": crew_id, "status": "completed"},
                    )
                except Exception:
                    pass

        except Exception as e:
            ev_err = ExecutionErrorEvent(
                execution_id=execution_id,
                error=str(e),
            )
            await self.broadcaster.publish(execution_id, ev_err)
            yield ev_err.model_dump()
