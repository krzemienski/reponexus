"""
Tests for API Usage Service
Tests API tracking, rate limit monitoring, and statistics
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch
from datetime import datetime, timedelta

from app.services.api_usage_service import (
    APIUsageService,
    get_api_usage_service
)


class TestAPIUsageService:
    """Test API usage tracking service"""

    @pytest.fixture
    def usage_service(self):
        """Create API usage service instance"""
        return APIUsageService()

    @pytest.fixture
    def mock_redis(self):
        """Create mock Redis client"""
        redis = AsyncMock()
        redis.zadd = AsyncMock()
        redis.expire = AsyncMock()
        redis.incr = AsyncMock(return_value=1)
        redis.hincrby = AsyncMock(return_value=1)
        redis.hset = AsyncMock()
        redis.hgetall = AsyncMock(return_value={})
        redis.get = AsyncMock(return_value=None)
        redis.setex = AsyncMock()
        redis.zrange = AsyncMock(return_value=[])
        redis.delete = AsyncMock()
        return redis

    def test_make_key(self, usage_service):
        """Test API usage key generation"""
        key = usage_service._make_key("calls", "20240101")
        assert key == "api_usage:calls:20240101"

    @pytest.mark.asyncio
    async def test_track_api_call(self, usage_service, mock_redis):
        """Test tracking an API call"""
        with patch("app.services.api_usage_service.get_redis", return_value=mock_redis):
            result = await usage_service.track_api_call(
                endpoint="/repos/owner/repo",
                method="GET",
                status_code=200,
                response_time=0.5,
                rate_limit_remaining=4950,
                rate_limit_limit=5000
            )

            assert result is True
            mock_redis.zadd.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_current_rate_limit(self, usage_service, mock_redis):
        """Test getting current rate limit status"""
        mock_redis.hgetall = AsyncMock(return_value={
            "remaining": "4950",
            "limit": "5000",
            "percentage": "99.0",
            "last_updated": datetime.utcnow().isoformat()
        })

        with patch("app.services.api_usage_service.get_redis", return_value=mock_redis):
            status = await usage_service.get_current_rate_limit()

            assert status["remaining"] == 4950
            assert status["limit"] == 5000
            assert status["percentage"] == 99.0

    @pytest.mark.asyncio
    async def test_get_today_stats(self, usage_service, mock_redis):
        """Test getting today's statistics"""
        today = datetime.utcnow().strftime("%Y%m%d")

        mock_redis.get = AsyncMock(return_value="100")
        mock_redis.hgetall = AsyncMock(return_value={
            "/repos": "50",
            "/users": "30",
            "/search": "20"
        })

        with patch("app.services.api_usage_service.get_redis", return_value=mock_redis):
            stats = await usage_service.get_today_stats()

            assert stats["date"] == today
            assert stats["total_calls"] == 100

    @pytest.mark.asyncio
    async def test_alert_low_rate_limit(self, usage_service, mock_redis):
        """Test low rate limit alert"""
        with patch("app.services.api_usage_service.get_redis", return_value=mock_redis):
            await usage_service._alert_low_rate_limit(50, 5000)

            mock_redis.setex.assert_called_once()

    @pytest.mark.asyncio
    async def test_get_stats_range(self, usage_service, mock_redis):
        """Test getting stats for date range"""
        start_date = datetime.utcnow() - timedelta(days=2)
        end_date = datetime.utcnow()

        mock_redis.get = AsyncMock(return_value="50")

        with patch("app.services.api_usage_service.get_redis", return_value=mock_redis):
            stats = await usage_service.get_stats_range(start_date, end_date)

            assert isinstance(stats, list)
            assert len(stats) >= 0

    @pytest.mark.asyncio
    async def test_get_endpoint_stats(self, usage_service, mock_redis):
        """Test getting endpoint statistics"""
        mock_redis.hgetall = AsyncMock(return_value={
            "/repos/owner/repo": "25",
            "/users/username": "15",
            "/search/repositories": "10"
        })

        with patch("app.services.api_usage_service.get_redis", return_value=mock_redis):
            stats = await usage_service.get_endpoint_stats(days=7)

            assert isinstance(stats, dict)

    @pytest.mark.asyncio
    async def test_get_hourly_stats(self, usage_service, mock_redis):
        """Test getting hourly statistics"""
        mock_redis.zrange = AsyncMock(return_value=[])

        with patch("app.services.api_usage_service.get_redis", return_value=mock_redis):
            stats = await usage_service.get_hourly_stats()

            assert isinstance(stats, list)

    @pytest.mark.asyncio
    async def test_get_alerts(self, usage_service, mock_redis):
        """Test getting active alerts"""
        mock_redis.get = AsyncMock(return_value="Rate limit low: 50/5000")

        with patch("app.services.api_usage_service.get_redis", return_value=mock_redis):
            alerts = await usage_service.get_alerts()

            assert isinstance(alerts, list)

    @pytest.mark.asyncio
    async def test_get_dashboard_data(self, usage_service, mock_redis):
        """Test getting comprehensive dashboard data"""
        today = datetime.utcnow().strftime("%Y%m%d")

        mock_redis.get = AsyncMock(return_value="100")
        mock_redis.hgetall = AsyncMock(return_value={
            "remaining": "4950",
            "limit": "5000"
        })
        mock_redis.zrange = AsyncMock(return_value=[])

        with patch("app.services.api_usage_service.get_redis", return_value=mock_redis):
            dashboard = await usage_service.get_dashboard_data()

            assert "today" in dashboard
            assert "rate_limit" in dashboard
            assert "endpoint_stats" in dashboard
            assert "hourly_stats" in dashboard
            assert "alerts" in dashboard
            assert "trend" in dashboard

    @pytest.mark.asyncio
    async def test_clear_old_data(self, usage_service, mock_redis):
        """Test clearing old data"""
        with patch("app.services.api_usage_service.get_redis", return_value=mock_redis):
            await usage_service.clear_old_data(days=7)

            # Should have called delete for various keys
            assert mock_redis.delete.called

    @pytest.mark.asyncio
    async def test_increment_counters(self, usage_service, mock_redis):
        """Test incrementing various counters"""
        with patch("app.services.api_usage_service.get_redis", return_value=mock_redis):
            await usage_service._increment_counters(
                endpoint="/repos/owner/repo",
                method="GET",
                status_code=200
            )

            assert mock_redis.incr.called
            assert mock_redis.hincrby.called
            assert mock_redis.expire.called

    @pytest.mark.asyncio
    async def test_track_rate_limit(self, usage_service, mock_redis):
        """Test tracking rate limit"""
        with patch("app.services.api_usage_service.get_redis", return_value=mock_redis):
            await usage_service._track_rate_limit(4950, 5000)

            mock_redis.hset.assert_called_once()

    def test_singleton_instance(self):
        """Test singleton pattern"""
        service1 = get_api_usage_service()
        service2 = get_api_usage_service()

        assert service1 is service2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
