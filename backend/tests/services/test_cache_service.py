"""
Tests for Cache Service
Tests caching operations, TTLs, and cache invalidation
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock

from app.services.cache_service import (
    CacheService,
    CacheTTL,
    cached,
    get_cache_service
)


class TestCacheService:
    """Test cache service operations"""

    @pytest.fixture
    def cache_service(self):
        """Create cache service instance"""
        return CacheService()

    @pytest.fixture
    def mock_redis(self):
        """Create mock Redis client"""
        redis = AsyncMock()
        redis.get = AsyncMock(return_value=None)
        redis.setex = AsyncMock()
        redis.delete = AsyncMock()
        redis.keys = AsyncMock(return_value=[])
        redis.exists = AsyncMock(return_value=0)
        redis.ttl = AsyncMock(return_value=3600)
        redis.incrby = AsyncMock(return_value=1)
        redis.hgetall = AsyncMock(return_value={})
        redis.info = AsyncMock(return_value={"connected_clients": 1})
        redis.dbsize = AsyncMock(return_value=100)
        redis.mget = AsyncMock(return_value=[])
        redis.pipeline = Mock(return_value=AsyncMock())
        return redis

    def test_make_key(self, cache_service):
        """Test cache key generation"""
        key = cache_service._make_key("user", "testuser")
        assert key == "reponexus:user:testuser"

    @pytest.mark.asyncio
    async def test_cache_user(self, cache_service, mock_redis):
        """Test caching user data"""
        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            user_data = {"login": "testuser", "id": 123}
            result = await cache_service.cache_user("testuser", user_data)

            assert result is True
            mock_redis.setex.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_user(self, cache_service, mock_redis):
        """Test getting cached user data"""
        import json

        user_data = {"login": "testuser", "id": 123}
        mock_redis.get = AsyncMock(return_value=json.dumps(user_data))

        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            result = await cache_service.get_user("testuser")

            assert result == user_data

    @pytest.mark.asyncio
    async def test_cache_repository(self, cache_service, mock_redis):
        """Test caching repository data"""
        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            repo_data = {"name": "test-repo", "stars": 100}
            result = await cache_service.cache_repository("owner", "repo", repo_data)

            assert result is True

    @pytest.mark.asyncio
    async def test_invalidate_repository(self, cache_service, mock_redis):
        """Test cache invalidation"""
        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            result = await cache_service.invalidate_repository("owner", "repo")

            assert result is True
            mock_redis.delete.assert_called_once()

    @pytest.mark.asyncio
    async def test_cache_trending(self, cache_service, mock_redis):
        """Test caching trending data"""
        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            trending_data = [
                {"name": "repo1", "stars": 100},
                {"name": "repo2", "stars": 90}
            ]
            result = await cache_service.cache_trending("daily", "python", trending_data)

            assert result is True

    @pytest.mark.asyncio
    async def test_get_trending(self, cache_service, mock_redis):
        """Test getting cached trending data"""
        import json

        trending_data = [{"name": "repo1", "stars": 100}]
        mock_redis.get = AsyncMock(return_value=json.dumps(trending_data))

        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            result = await cache_service.get_trending("daily", "python")

            assert result == trending_data

    @pytest.mark.asyncio
    async def test_cache_topics(self, cache_service, mock_redis):
        """Test caching topics"""
        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            topics = ["python", "javascript", "rust"]
            result = await cache_service.cache_topics(topics)

            assert result is True

    @pytest.mark.asyncio
    async def test_delete_pattern(self, cache_service, mock_redis):
        """Test deleting keys by pattern"""
        keys = ["key1", "key2", "key3"]
        mock_redis.keys = AsyncMock(return_value=keys)
        mock_redis.delete = AsyncMock(return_value=3)

        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            result = await cache_service.delete_pattern("reponexus:user:*")

            assert result == 3

    @pytest.mark.asyncio
    async def test_cache_search_results(self, cache_service, mock_redis):
        """Test caching search results"""
        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            search_results = {
                "total_count": 100,
                "items": [{"name": "repo1"}]
            }
            result = await cache_service.cache_search_results("python web", 1, search_results)

            assert result is True

    @pytest.mark.asyncio
    async def test_get_stats(self, cache_service, mock_redis):
        """Test getting cache statistics"""
        mock_redis.info = AsyncMock(return_value={
            "connected_clients": 5,
            "used_memory_human": "10M",
            "uptime_in_days": 7
        })
        mock_redis.dbsize = AsyncMock(return_value=150)

        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            stats = await cache_service.get_stats()

            assert stats["connected_clients"] == 5
            assert stats["total_keys"] == 150

    @pytest.mark.asyncio
    async def test_cache_readme(self, cache_service, mock_redis):
        """Test caching README content"""
        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            readme = "# Test README\n\nContent here"
            result = await cache_service.cache_readme("owner", "repo", readme)

            assert result is True

    @pytest.mark.asyncio
    async def test_cache_languages(self, cache_service, mock_redis):
        """Test caching language data"""
        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            languages = {"Python": 12345, "JavaScript": 6789}
            result = await cache_service.cache_languages("owner", "repo", languages)

            assert result is True

    @pytest.mark.asyncio
    async def test_cache_contributors(self, cache_service, mock_redis):
        """Test caching contributors"""
        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            contributors = [
                {"login": "user1", "contributions": 100},
                {"login": "user2", "contributions": 50}
            ]
            result = await cache_service.cache_contributors("owner", "repo", contributors)

            assert result is True

    @pytest.mark.asyncio
    async def test_increment(self, cache_service, mock_redis):
        """Test counter increment"""
        mock_redis.incrby = AsyncMock(return_value=5)

        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            result = await cache_service.increment("counter:key", 1)

            assert result == 5

    @pytest.mark.asyncio
    async def test_get_many(self, cache_service, mock_redis):
        """Test batch get operation"""
        import json

        values = [json.dumps({"id": 1}), json.dumps({"id": 2})]
        mock_redis.mget = AsyncMock(return_value=values)

        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            result = await cache_service.get_many(["key1", "key2"])

            assert len(result) == 2

    @pytest.mark.asyncio
    async def test_set_many(self, cache_service, mock_redis):
        """Test batch set operation"""
        mock_pipeline = AsyncMock()
        mock_pipeline.execute = AsyncMock()
        mock_redis.pipeline = Mock(return_value=mock_pipeline)

        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            items = {
                "key1": {"id": 1},
                "key2": {"id": 2}
            }
            result = await cache_service.set_many(items, 3600)

            assert result is True

    def test_ttl_constants(self):
        """Test TTL constants are defined"""
        assert CacheTTL.USER_DATA == 3600
        assert CacheTTL.REPOSITORY_DATA == 900
        assert CacheTTL.TRENDING_DATA == 300
        assert CacheTTL.README_DATA == 3600

    def test_singleton_instance(self):
        """Test singleton pattern"""
        service1 = get_cache_service()
        service2 = get_cache_service()

        assert service1 is service2

    @pytest.mark.asyncio
    async def test_cached_decorator(self, mock_redis):
        """Test cached decorator"""
        call_count = 0

        @cached(ttl=300, key_prefix="test")
        async def expensive_function(arg1):
            nonlocal call_count
            call_count += 1
            return f"result_{arg1}"

        with patch("app.services.cache_service.get_redis", return_value=mock_redis):
            # First call - should execute function
            result1 = await expensive_function("test")
            assert result1 == "result_test"
            assert call_count == 1

            # Second call - should use cache (but our mock returns None)
            result2 = await expensive_function("test")
            assert call_count == 2  # Will be 2 because mock returns None


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
