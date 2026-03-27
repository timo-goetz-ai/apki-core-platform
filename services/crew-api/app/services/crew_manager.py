import asyncio
import threading
import uuid
from collections.abc import AsyncGenerator
from pathlib import Path

import yaml
from crewai import Agent, Crew, LLM, Process, Task

from app.config import Settings
from app.integrations.n8n import N8NClient
from app.integrations.nocodb import NocoDBClient
from app.models.crew import CrewConfig
from app.models.events import (
    ExecutionCompletedEvent,
    ExecutionErrorEvent,
    ExecutionStartedEvent,
    TaskCompletedEvent,
    TaskStartedEvent,
)
from app.services.event_stream import EventBroadcaster


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
            for cid, cdata in (data.get("crews") or {}).items():
                self._crews[cid] = CrewConfig(**cdata)

    def list_crews(self) -> list[dict]:
        return [
            {"id": cid, "name": c.name, "agents": len(c.agents), "tasks": len(c.tasks)}
            for cid, c in self._crews.items()
        ]

    def get_crew(self, crew_id: str) -> CrewConfig | None:
        return self._crews.get(crew_id)

    def _build_llm(self, model: str) -> LLM:
        if self.settings.gemini_api_key:
            # Gemini direct — map openrouter model names to gemini/ prefix
            gemini_model = model.replace("openrouter/google/", "gemini/").replace("openrouter/", "gemini/")
            if not gemini_model.startswith("gemini/"):
                gemini_model = f"gemini/{gemini_model}"
            return LLM(model=gemini_model, api_key=self.settings.gemini_api_key)
        if self.settings.openrouter_api_key:
            return LLM(
                model=model,
                base_url="https://openrouter.ai/api/v1",
                api_key=self.settings.openrouter_api_key,
            )
        raise RuntimeError("Kein LLM API Key konfiguriert (GEMINI_API_KEY oder OPENROUTER_API_KEY)")

    async def start_crew(
        self, crew_id: str, inputs: dict, execution_id: str | None = None
    ) -> AsyncGenerator[dict, None]:
        crew_cfg = self.get_crew(crew_id)
        if not crew_cfg:
            raise ValueError(f"Crew '{crew_id}' nicht gefunden")

        execution_id = execution_id or str(uuid.uuid4())
        webhooks = crew_cfg.webhooks or {}

        # n8n on_start webhook (fire-and-forget)
        if webhooks.get("on_start"):
            try:
                n8n = N8NClient(self.settings)
                await n8n.trigger_webhook(
                    webhooks["on_start"],
                    {"execution_id": execution_id, "crew_id": crew_id, "inputs": inputs},
                )
            except Exception:
                pass

        ev_start = ExecutionStartedEvent(execution_id=execution_id, crew_id=crew_id)
        await self.broadcaster.publish(execution_id, ev_start)
        yield ev_start.model_dump()

        try:
            llm = self._build_llm(crew_cfg.model)

            # Build agent map
            agent_map: dict[str, Agent] = {}
            for a in crew_cfg.agents:
                agent_map[a.id] = Agent(
                    role=a.role,
                    goal=a.goal,
                    backstory=a.backstory or f"Experte für {a.role}",
                    llm=llm,
                    verbose=False,
                    allow_delegation=False,
                )

            # Build task map — first pass (no context yet)
            task_map: dict[str, Task] = {}
            for t in crew_cfg.tasks:
                task_map[t.id] = Task(
                    description=t.description,
                    expected_output=t.expected_output,
                    agent=agent_map[t.agent_id],
                )

            # Second pass — wire context between tasks
            for t in crew_cfg.tasks:
                if t.context_task_ids:
                    task_map[t.id].context = [task_map[cid] for cid in t.context_task_ids]

            tasks_ordered = [task_map[t.id] for t in crew_cfg.tasks]

            # Thread-safe task output collection via callback
            collected: list[tuple[str, str, str]] = []  # (task_id, agent_id, output)
            task_idx = [0]
            lock = threading.Lock()

            def task_callback(task_output):
                with lock:
                    idx = task_idx[0]
                    if idx < len(crew_cfg.tasks):
                        t = crew_cfg.tasks[idx]
                        collected.append((t.id, t.agent_id, str(task_output)))
                    task_idx[0] += 1

            crew = Crew(
                agents=list(agent_map.values()),
                tasks=tasks_ordered,
                process=Process.sequential if crew_cfg.process == "sequential" else Process.hierarchical,
                verbose=False,
                task_callback=task_callback,
            )

            # Run blocking kickoff() in thread pool — keeps event loop free
            loop = asyncio.get_event_loop()
            final_result = await loop.run_in_executor(
                None, lambda: crew.kickoff(inputs=inputs)
            )

            # Emit task events in sequence after execution completes
            for task_id, agent_id, output in collected:
                ev_ts = TaskStartedEvent(
                    execution_id=execution_id, task_id=task_id, agent_id=agent_id
                )
                await self.broadcaster.publish(execution_id, ev_ts)
                yield ev_ts.model_dump()

                ev_tc = TaskCompletedEvent(
                    execution_id=execution_id,
                    task_id=task_id,
                    agent_id=agent_id,
                    output=output[:3000],
                )
                await self.broadcaster.publish(execution_id, ev_tc)
                yield ev_tc.model_dump()

            # Persist to NocoDB content_pieces (best-effort)
            await self._save_content_piece(inputs, str(final_result), execution_id)

            ev_done = ExecutionCompletedEvent(
                execution_id=execution_id,
                result=str(final_result)[:5000],
            )
            await self.broadcaster.publish(execution_id, ev_done)
            yield ev_done.model_dump()

            # n8n on_complete webhook
            if webhooks.get("on_complete"):
                try:
                    n8n = N8NClient(self.settings)
                    await n8n.trigger_webhook(
                        webhooks["on_complete"],
                        {
                            "execution_id": execution_id,
                            "crew_id": crew_id,
                            "status": "completed",
                            "result": str(final_result)[:2000],
                        },
                    )
                except Exception:
                    pass

        except Exception as e:
            ev_err = ExecutionErrorEvent(execution_id=execution_id, error=str(e))
            await self.broadcaster.publish(execution_id, ev_err)
            yield ev_err.model_dump()

    async def _save_content_piece(
        self, inputs: dict, result: str, execution_id: str
    ) -> None:
        table_id = self.settings.nocodb_content_pieces_table_id
        if not table_id:
            return
        nocodb = NocoDBClient(self.settings)
        if not nocodb._enabled():
            return
        try:
            await nocodb.create_record(
                table_id,
                {
                    "piece_id": f"crew-{execution_id[:8]}",
                    "title": inputs.get("topic", ""),
                    "topic": inputs.get("topic", ""),
                    "category": inputs.get("category", "Allgemein"),
                    "status": "draft",
                    "content_text": result,
                    "target_platforms": inputs.get("target_platforms", "blog"),
                    "pipeline_job_id": inputs.get("pipeline_job_id", ""),
                },
            )
        except Exception:
            pass
