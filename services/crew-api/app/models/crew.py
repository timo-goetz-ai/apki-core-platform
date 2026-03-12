from pydantic import BaseModel


class AgentConfig(BaseModel):
    id: str
    role: str
    goal: str
    mcp_servers: list[str] = []


class TaskConfig(BaseModel):
    id: str
    agent_id: str
    description: str


class CrewConfig(BaseModel):
    name: str
    agents: list[AgentConfig]
    tasks: list[TaskConfig]
    process: str = "sequential"
    webhooks: dict = {}
