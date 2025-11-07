"""
Cache Service - Intelligent caching layer for GitHub data
Provides Redis-based caching with different TTLs for different data types
"""
import json
import logging
from typing import Optional, Any, List, Dict, Callable
from datetime import datetime, timedelta
from functools import wraps
import hashlib

from app.core.cache import get_redis

logger = logging.getLogger(__name__)


class CacheTTL:
    """Cache TTL constants in seconds"""
    USER_DATA = 3600  # 1 hour
    REPOSITORY_DATA = 900  # 15 minutes
    TRENDING_DATA = 300  # 5 minutes
    README_DATA = 3600  # 1 hour
    LANGUAGES_DATA = 1800  # 30 minutes
    CONTRIBUTORS_DATA = 1800  # 30 minutes
    TOPICS_DATA = 3600  # 1 hour
    SEARCH_RESULTS = 600  # 10 minutes


class CacheService:
    """
    Intelligent caching service for GitHub data
    Provides methods for caching, invalidation, and cache warming
    """

    def __init__(self):
        self.prefix = "reponexus"

    def _make_key(self, *parts: str) -> str:
        """Create a cache key from parts"""
        key_parts = [self.prefix] + list(parts)
        return ":".join(key_parts)

    async def get(self, key: str) -> Optional[Any]:
        """Get a value from cache"""
        try:
            redis = await get_redis()
            value = await redis.get(key)

            if value:
                # Try to parse as JSON
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value

            return None

        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None

    async def set(self, key: str, value: Any, ttl: int) -> bool:
        """Set a value in cache with TTL"""
        try:
            redis = await get_redis()

            # Serialize value
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            elif not isinstance(value, str):
                value = str(value)

            await redis.setex(key, ttl, value)
            return True

        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete a key from cache"""
        try:
            redis = await get_redis()
            await redis.delete(key)
            return True

        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern"""
        try:
            redis = await get_redis()
            keys = await redis.keys(pattern)

            if keys:
                deleted = await redis.delete(*keys)
                logger.info(f"Deleted {deleted} keys matching pattern: {pattern}")
                return deleted

            return 0

        except Exception as e:
            logger.error(f"Cache delete pattern error for {pattern}: {e}")
            return 0

    async def exists(self, key: str) -> bool:
        """Check if a key exists in cache"""
        try:
            redis = await get_redis()
            return await redis.exists(key) > 0

        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False

    async def get_ttl(self, key: str) -> int:
        """Get remaining TTL for a key"""
        try:
            redis = await get_redis()
            return await redis.ttl(key)

        except Exception as e:
            logger.error(f"Cache TTL error for key {key}: {e}")
            return -1

    async def increment(self, key: str, amount: int = 1) -> int:
        """Increment a counter"""
        try:
            redis = await get_redis()
            return await redis.incrby(key, amount)

        except Exception as e:
            logger.error(f"Cache increment error for key {key}: {e}")
            return 0

    # ==================== User Caching ====================

    async def cache_user(self, username: str, data: Dict[str, Any]) -> bool:
        """Cache user data"""
        key = self._make_key("user", username)
        return await self.set(key, data, CacheTTL.USER_DATA)

    async def get_user(self, username: str) -> Optional[Dict[str, Any]]:
        """Get cached user data"""
        key = self._make_key("user", username)
        return await self.get(key)

    async def invalidate_user(self, username: str) -> bool:
        """Invalidate user cache"""
        key = self._make_key("user", username)
        return await self.delete(key)

    # ==================== Repository Caching ====================

    async def cache_repository(self, owner: str, name: str, data: Dict[str, Any]) -> bool:
        """Cache repository data"""
        key = self._make_key("repo", owner, name)
        return await self.set(key, data, CacheTTL.REPOSITORY_DATA)

    async def get_repository(self, owner: str, name: str) -> Optional[Dict[str, Any]]:
        """Get cached repository data"""
        key = self._make_key("repo", owner, name)
        return await self.get(key)

    async def invalidate_repository(self, owner: str, name: str) -> bool:
        """Invalidate repository cache"""
        key = self._make_key("repo", owner, name)
        return await self.delete(key)

    # ==================== README Caching ====================

    async def cache_readme(self, owner: str, name: str, content: str) -> bool:
        """Cache README content"""
        key = self._make_key("readme", owner, name)
        return await self.set(key, content, CacheTTL.README_DATA)

    async def get_readme(self, owner: str, name: str) -> Optional[str]:
        """Get cached README content"""
        key = self._make_key("readme", owner, name)
        return await self.get(key)

    # ==================== Languages Caching ====================

    async def cache_languages(self, owner: str, name: str, languages: Dict[str, int]) -> bool:
        """Cache repository languages"""
        key = self._make_key("languages", owner, name)
        return await self.set(key, languages, CacheTTL.LANGUAGES_DATA)

    async def get_languages(self, owner: str, name: str) -> Optional[Dict[str, int]]:
        """Get cached repository languages"""
        key = self._make_key("languages", owner, name)
        return await self.get(key)

    # ==================== Contributors Caching ====================

    async def cache_contributors(
        self,
        owner: str,
        name: str,
        contributors: List[Dict[str, Any]]
    ) -> bool:
        """Cache repository contributors"""
        key = self._make_key("contributors", owner, name)
        return await self.set(key, contributors, CacheTTL.CONTRIBUTORS_DATA)

    async def get_contributors(self, owner: str, name: str) -> Optional[List[Dict[str, Any]]]:
        """Get cached repository contributors"""
        key = self._make_key("contributors", owner, name)
        return await self.get(key)

    # ==================== Trending Caching ====================

    async def cache_trending(
        self,
        period: str,
        language: Optional[str],
        data: List[Dict[str, Any]]
    ) -> bool:
        """Cache trending repositories"""
        lang_part = language if language else "all"
        key = self._make_key("trending", period, lang_part)
        return await self.set(key, data, CacheTTL.TRENDING_DATA)

    async def get_trending(
        self,
        period: str,
        language: Optional[str] = None
    ) -> Optional[List[Dict[str, Any]]]:
        """Get cached trending repositories"""
        lang_part = language if language else "all"
        key = self._make_key("trending", period, lang_part)
        return await self.get(key)

    # ==================== Topics Caching ====================

    async def cache_topics(self, topics: List[str]) -> bool:
        """Cache popular topics list"""
        key = self._make_key("topics", "popular")
        return await self.set(key, topics, CacheTTL.TOPICS_DATA)

    async def get_topics(self) -> Optional[List[str]]:
        """Get cached popular topics"""
        key = self._make_key("topics", "popular")
        return await self.get(key)

    async def cache_topic_repos(
        self,
        topic: str,
        page: int,
        data: Dict[str, Any]
    ) -> bool:
        """Cache repositories for a topic"""
        key = self._make_key("topic_repos", topic, str(page))
        return await self.set(key, data, CacheTTL.TOPICS_DATA)

    async def get_topic_repos(self, topic: str, page: int) -> Optional[Dict[str, Any]]:
        """Get cached repositories for a topic"""
        key = self._make_key("topic_repos", topic, str(page))
        return await self.get(key)

    # ==================== Search Results Caching ====================

    async def cache_search_results(
        self,
        query: str,
        page: int,
        results: Dict[str, Any]
    ) -> bool:
        """Cache search results"""
        # Create a hash of the query for the key
        query_hash = hashlib.md5(query.encode()).hexdigest()[:16]
        key = self._make_key("search", query_hash, str(page))
        return await self.set(key, results, CacheTTL.SEARCH_RESULTS)

    async def get_search_results(self, query: str, page: int) -> Optional[Dict[str, Any]]:
        """Get cached search results"""
        query_hash = hashlib.md5(query.encode()).hexdigest()[:16]
        key = self._make_key("search", query_hash, str(page))
        return await self.get(key)

    # ==================== Cache Warming ====================

    async def warm_popular_repos(self, repos: List[Dict[str, str]]) -> int:
        """
        Warm cache with popular repositories
        repos: List of {"owner": "...", "name": "..."} dicts
        """
        warmed = 0
        for repo in repos:
            try:
                owner = repo.get("owner")
                name = repo.get("name")

                if owner and name:
                    # Set a placeholder to indicate warming is needed
                    key = self._make_key("warm", owner, name)
                    await self.set(key, {"warming": True}, 60)
                    warmed += 1

            except Exception as e:
                logger.error(f"Error warming cache for repo {repo}: {e}")

        logger.info(f"Warmed cache for {warmed} popular repositories")
        return warmed

    # ==================== Cache Statistics ====================

    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            redis = await get_redis()

            # Get info
            info = await redis.info()

            stats = {
                "connected_clients": info.get("connected_clients", 0),
                "used_memory_human": info.get("used_memory_human", "0"),
                "total_keys": await redis.dbsize(),
                "uptime_days": info.get("uptime_in_days", 0)
            }

            # Count keys by prefix
            patterns = {
                "users": f"{self.prefix}:user:*",
                "repos": f"{self.prefix}:repo:*",
                "trending": f"{self.prefix}:trending:*",
                "topics": f"{self.prefix}:topic*",
                "search": f"{self.prefix}:search:*"
            }

            for name, pattern in patterns.items():
                keys = await redis.keys(pattern)
                stats[f"{name}_count"] = len(keys)

            return stats

        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {}

    # ==================== Batch Operations ====================

    async def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Get multiple keys at once"""
        try:
            redis = await get_redis()
            values = await redis.mget(keys)

            result = {}
            for key, value in zip(keys, values):
                if value:
                    try:
                        result[key] = json.loads(value)
                    except json.JSONDecodeError:
                        result[key] = value

            return result

        except Exception as e:
            logger.error(f"Cache get_many error: {e}")
            return {}

    async def set_many(self, items: Dict[str, Any], ttl: int) -> bool:
        """Set multiple keys at once"""
        try:
            redis = await get_redis()

            # Use pipeline for atomic operation
            pipe = redis.pipeline()

            for key, value in items.items():
                if isinstance(value, (dict, list)):
                    value = json.dumps(value)
                elif not isinstance(value, str):
                    value = str(value)

                pipe.setex(key, ttl, value)

            await pipe.execute()
            return True

        except Exception as e:
            logger.error(f"Cache set_many error: {e}")
            return False


# Decorator for caching function results
def cached(ttl: int, key_prefix: str):
    """
    Decorator to cache function results

    Usage:
        @cached(ttl=300, key_prefix="my_function")
        async def my_function(arg1, arg2):
            return expensive_operation(arg1, arg2)
    """
    def decorator(func: Callable):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Create cache key from function name and arguments
            cache_service = get_cache_service()

            # Generate key from args and kwargs
            key_parts = [key_prefix, func.__name__]
            key_parts.extend(str(arg) for arg in args)
            key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))

            key = cache_service._make_key(*key_parts)

            # Try to get from cache
            cached_result = await cache_service.get(key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {key}")
                return cached_result

            # Execute function
            result = await func(*args, **kwargs)

            # Cache result
            if result is not None:
                await cache_service.set(key, result, ttl)
                logger.debug(f"Cached result for {key}")

            return result

        return wrapper
    return decorator


# Singleton instance
_cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """Get or create CacheService singleton"""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service
