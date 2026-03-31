from datetime import datetime

from sqlalchemy import DateTime, Enum, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base

TaskStatus = Enum(
    "pending", "approved", "executing", "completed", "failed", "aborted",
    name="task_status",
)
TaskSource = Enum("telegram", "discord", "auto", name="task_source")


class JarvisTask(Base):
    __tablename__ = "jarvis_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[str | None] = mapped_column(TaskSource, nullable=True)
    intent: Mapped[str | None] = mapped_column(Text, nullable=True)
    proposed_action: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string
    mcp_server: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(TaskStatus, default="pending", nullable=False)
    tg_chat_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    tg_msg_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    audit_log: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
