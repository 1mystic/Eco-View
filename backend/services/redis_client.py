import json
from typing import Any, Optional

import redis.asyncio as aioredis

from ..core.config import settings

_pool: Optional[aioredis.ConnectionPool] = None


def get_pool() -> aioredis.ConnectionPool:
    global _pool
    if _pool is None:
        _pool = aioredis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)
    return _pool


def get_client() -> aioredis.Redis:
    return aioredis.Redis(connection_pool=get_pool())


async def cache_set(key: str, value: Any, ttl: int = 300) -> None:
    async with get_client() as r:
        await r.setex(key, ttl, json.dumps(value))


async def cache_get(key: str) -> Optional[Any]:
    async with get_client() as r:
        raw = await r.get(key)
        return json.loads(raw) if raw else None


async def cache_delete(key: str) -> None:
    async with get_client() as r:
        await r.delete(key)


async def enqueue_job(queue: str, payload: dict) -> None:
    async with get_client() as r:
        await r.rpush(queue, json.dumps(payload))
