import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

_tasks: dict[str, dict] = {}


class TaskCreate(BaseModel):
    title: str
    description: str
    agent_id: str
    priority: str = "normal"


@router.get("/")
async def list_tasks():
    return list(_tasks.values())


@router.post("/")
async def create_task(task: TaskCreate):
    task_id = str(uuid.uuid4())
    entry = {
        "id":          task_id,
        "title":       task.title,
        "description": task.description,
        "agent_id":    task.agent_id,
        "priority":    task.priority,
        "status":      "pending",
        "created_at":  datetime.now().isoformat(),
    }
    _tasks[task_id] = entry
    return entry


@router.get("/{task_id}")
async def get_task(task_id: str):
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return _tasks[task_id]


@router.patch("/{task_id}/status")
async def update_task_status(task_id: str, status: str):
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    _tasks[task_id]["status"] = status
    _tasks[task_id]["updated_at"] = datetime.now().isoformat()
    return _tasks[task_id]
