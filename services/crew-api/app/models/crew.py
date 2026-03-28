from pydantic import BaseModel


class AgentConfig(BaseModel):
    id: str
    role: str
    goal: str
    backstory: str = ""
    model: str | None = None   # überschreibt crew-level model wenn gesetzt
    mcp_servers: list[str] = []


class TaskConfig(BaseModel):
    id: str
    agent_id: str
    description: str
    expected_output: str = "Detaillierter, umfassender Output"
    context_task_ids: list[str] = []


class CrewConfig(BaseModel):
    name: str
    model: str = "openrouter/google/gemini-2.0-flash-exp"
    agents: list[AgentConfig]
    tasks: list[TaskConfig]
    process: str = "sequential"
    webhooks: dict = {}
