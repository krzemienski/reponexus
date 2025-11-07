import redis.asyncio as redis
from typing import Optional, Any
import json
from app.core.config import settings

# Create Redis client
redis_client: Optional[redis.Redis] = None


async def get_redis() -> redis.Redis:
    """
    Get Redis client instance
    """
    global redis_client

    if redis_client is None:
        redis_client = await redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True,
        )

    return redis_client


async def cache_get(key: str) -> Optional[Any]:
    """
    Get a value from cache
    """
    client = await get_redis()
    value = await client.get(key)

    if value:
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value

    return None


async def cache_set(key: str, value: Any, ttl: int = settings.REDIS_CACHE_TTL) -> None:
    """
    Set a value in cache with TTL
    """
    client = await get_redis()

    if isinstance(value, (dict, list)):
        value = json.dumps(value)

    await client.setex(key, ttl, value)


async def cache_delete(key: str) -> None:
    """
    Delete a key from cache
    """
    client = await get_redis()
    await client.delete(key)


async def cache_clear_pattern(pattern: str) -> None:
    """
    Clear all keys matching a pattern
    """
    client = await get_redis()
    keys = await client.keys(pattern)

    if keys:
        await client.delete(*keys)
