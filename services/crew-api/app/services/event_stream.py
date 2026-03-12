import json
from collections.abc import AsyncGenerator

import redis.asyncio as redis

from app.models.events import BaseEvent


class EventBroadcaster:
    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._client: redis.Redis | None = None

    async def connect(self):
        self._client = redis.from_url(self.redis_url, decode_responses=True)

    async def disconnect(self):
        if self._client:
            await self._client.aclose()

    def _channel(self, execution_id: str) -> str:
        return f"execution:{execution_id}"

    async def publish(self, execution_id: str, event: BaseEvent):
        if not self._client:
            raise RuntimeError("EventBroadcaster not connected")
        channel = self._channel(execution_id)
        await self._client.publish(channel, event.model_dump_json())

    async def subscribe(self, execution_id: str) -> AsyncGenerator[str, None]:
        if not self._client:
            raise RuntimeError("EventBroadcaster not connected")
        pubsub = self._client.pubsub()
        await pubsub.subscribe(self._channel(execution_id))
        async for msg in pubsub.listen():
            if msg["type"] == "message":
                yield msg["data"]
