from datetime import datetime
from typing import Literal

from pydantic import BaseModel


class BaseEvent(BaseModel):
    type: str
    execution_id: str
    timestamp: datetime | None = None

    def __init__(self, **data):
        if "timestamp" not in data:
            data["timestamp"] = datetime.utcnow()
        super().__init__(**data)


class ExecutionStartedEvent(BaseEvent):
    type: Literal["execution_started"] = "execution_started"
    crew_id: str = ""


class TaskStartedEvent(BaseEvent):
    type: Literal["task_started"] = "task_started"
    task_id: str
    agent_id: str


class TaskCompletedEvent(BaseEvent):
    type: Literal["task_completed"] = "task_completed"
    task_id: str
    agent_id: str
    output: str = ""


class ExecutionCompletedEvent(BaseEvent):
    type: Literal["execution_completed"] = "execution_completed"


class ExecutionErrorEvent(BaseEvent):
    type: Literal["execution_error"] = "execution_error"
    error: str
