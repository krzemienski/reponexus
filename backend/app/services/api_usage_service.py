"""
API Usage Service - Track and monitor GitHub API usage
Tracks all API calls, monitors rate limits, and provides usage statistics
"""
import logging
from typing import Optional, Dict, List, Any
from datetime import datetime, timedelta
from collections import defaultdict

from app.core.cache import get_redis

logger = logging.getLogger(__name__)


class APIUsageService:
    """
    Service for tracking GitHub API usage
    Monitors rate limits, logs API calls, and provides analytics
    """

    def __init__(self):
        self.prefix = "api_usage"

    def _make_key(self, *parts: str) -> str:
        """Create a key for API usage tracking"""
        key_parts = [self.prefix] + list(parts)
        return ":".join(key_parts)

    async def track_api_call(
        self,
        endpoint: str,
        method: str,
        status_code: int,
        response_time: float,
        rate_limit_remaining: Optional[int] = None,
        rate_limit_limit: Optional[int] = None,
        user_id: Optional[str] = None
    ) -> bool:
        """
        Track an API call
        """
        try:
            redis = await get_redis()
            timestamp = datetime.utcnow()

            # Create call record
            call_record = {
                "endpoint": endpoint,
                "method": method,
                "status_code": status_code,
                "response_time": response_time,
                "rate_limit_remaining": rate_limit_remaining,
                "rate_limit_limit": rate_limit_limit,
                "user_id": user_id,
                "timestamp": timestamp.isoformat()
            }

            # Store in a sorted set with timestamp as score
            key = self._make_key("calls", timestamp.strftime("%Y%m%d"))
            await redis.zadd(
                key,
                {str(call_record): timestamp.timestamp()}
            )

            # Set expiry to 7 days
            await redis.expire(key, 7 * 24 * 60 * 60)

            # Increment counters
            await self._increment_counters(endpoint, method, status_code)

            # Track rate limit
            if rate_limit_remaining is not None and rate_limit_limit is not None:
                await self._track_rate_limit(rate_limit_remaining, rate_limit_limit)

            return True

        except Exception as e:
            logger.error(f"Error tracking API call: {e}")
            return False

    async def _increment_counters(
        self,
        endpoint: str,
        method: str,
        status_code: int
    ):
        """Increment various counters for analytics"""
        try:
            redis = await get_redis()
            today = datetime.utcnow().strftime("%Y%m%d")

            # Total calls today
            await redis.incr(self._make_key("total", today))

            # Calls by endpoint
            await redis.hincrby(
                self._make_key("by_endpoint", today),
                endpoint,
                1
            )

            # Calls by method
            await redis.hincrby(
                self._make_key("by_method", today),
                method,
                1
            )

            # Calls by status code
            await redis.hincrby(
                self._make_key("by_status", today),
                str(status_code),
                1
            )

            # Set expiry
            for key_suffix in ["total", "by_endpoint", "by_method", "by_status"]:
                key = self._make_key(key_suffix, today)
                await redis.expire(key, 7 * 24 * 60 * 60)

        except Exception as e:
            logger.error(f"Error incrementing counters: {e}")

    async def _track_rate_limit(
        self,
        remaining: int,
        limit: int
    ):
        """Track rate limit status"""
        try:
            redis = await get_redis()
            timestamp = datetime.utcnow()

            key = self._make_key("rate_limit")

            # Store rate limit info
            await redis.hset(
                key,
                mapping={
                    "remaining": remaining,
                    "limit": limit,
                    "percentage": (remaining / limit * 100) if limit > 0 else 0,
                    "last_updated": timestamp.isoformat()
                }
            )

            # Alert if rate limit is low
            if remaining < 100:
                await self._alert_low_rate_limit(remaining, limit)

        except Exception as e:
            logger.error(f"Error tracking rate limit: {e}")

    async def _alert_low_rate_limit(self, remaining: int, limit: int):
        """Alert when rate limit is low"""
        logger.warning(f"GitHub API rate limit low: {remaining}/{limit} remaining")

        try:
            redis = await get_redis()
            alert_key = self._make_key("alerts", "low_rate_limit")

            # Store alert (with 1 hour expiry to avoid spam)
            await redis.setex(
                alert_key,
                3600,
                f"Rate limit low: {remaining}/{limit}"
            )

        except Exception as e:
            logger.error(f"Error creating alert: {e}")

    async def get_current_rate_limit(self) -> Dict[str, Any]:
        """Get current rate limit status"""
        try:
            redis = await get_redis()
            key = self._make_key("rate_limit")

            data = await redis.hgetall(key)

            if not data:
                return {
                    "remaining": None,
                    "limit": None,
                    "percentage": None,
                    "last_updated": None
                }

            return {
                "remaining": int(data.get("remaining", 0)),
                "limit": int(data.get("limit", 0)),
                "percentage": float(data.get("percentage", 0)),
                "last_updated": data.get("last_updated")
            }

        except Exception as e:
            logger.error(f"Error getting rate limit: {e}")
            return {}

    async def get_today_stats(self) -> Dict[str, Any]:
        """Get today's API usage statistics"""
        try:
            redis = await get_redis()
            today = datetime.utcnow().strftime("%Y%m%d")

            # Get total calls
            total_calls = await redis.get(self._make_key("total", today))
            total_calls = int(total_calls) if total_calls else 0

            # Get calls by endpoint
            by_endpoint = await redis.hgetall(self._make_key("by_endpoint", today))
            by_endpoint = {k: int(v) for k, v in by_endpoint.items()}

            # Get calls by method
            by_method = await redis.hgetall(self._make_key("by_method", today))
            by_method = {k: int(v) for k, v in by_method.items()}

            # Get calls by status
            by_status = await redis.hgetall(self._make_key("by_status", today))
            by_status = {k: int(v) for k, v in by_status.items()}

            return {
                "date": today,
                "total_calls": total_calls,
                "by_endpoint": by_endpoint,
                "by_method": by_method,
                "by_status": by_status
            }

        except Exception as e:
            logger.error(f"Error getting today's stats: {e}")
            return {}

    async def get_stats_range(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> List[Dict[str, Any]]:
        """Get API usage statistics for a date range"""
        try:
            redis = await get_redis()
            stats = []

            current_date = start_date
            while current_date <= end_date:
                date_str = current_date.strftime("%Y%m%d")

                total_calls = await redis.get(self._make_key("total", date_str))
                total_calls = int(total_calls) if total_calls else 0

                if total_calls > 0:
                    stats.append({
                        "date": date_str,
                        "total_calls": total_calls
                    })

                current_date += timedelta(days=1)

            return stats

        except Exception as e:
            logger.error(f"Error getting stats range: {e}")
            return []

    async def get_endpoint_stats(self, days: int = 7) -> Dict[str, int]:
        """Get endpoint statistics for the last N days"""
        try:
            redis = await get_redis()
            endpoint_totals = defaultdict(int)

            for i in range(days):
                date = (datetime.utcnow() - timedelta(days=i)).strftime("%Y%m%d")
                by_endpoint = await redis.hgetall(self._make_key("by_endpoint", date))

                for endpoint, count in by_endpoint.items():
                    endpoint_totals[endpoint] += int(count)

            return dict(endpoint_totals)

        except Exception as e:
            logger.error(f"Error getting endpoint stats: {e}")
            return {}

    async def get_hourly_stats(self) -> List[Dict[str, Any]]:
        """Get hourly API usage for today"""
        try:
            redis = await get_redis()
            today = datetime.utcnow().strftime("%Y%m%d")

            # Get all calls for today
            key = self._make_key("calls", today)
            calls = await redis.zrange(key, 0, -1, withscores=True)

            # Group by hour
            hourly_counts = defaultdict(int)
            for call_str, timestamp in calls:
                dt = datetime.fromtimestamp(timestamp)
                hour = dt.strftime("%Y-%m-%d %H:00")
                hourly_counts[hour] += 1

            # Convert to list
            stats = [
                {"hour": hour, "count": count}
                for hour, count in sorted(hourly_counts.items())
            ]

            return stats

        except Exception as e:
            logger.error(f"Error getting hourly stats: {e}")
            return []

    async def get_alerts(self) -> List[Dict[str, str]]:
        """Get active alerts"""
        try:
            redis = await get_redis()
            alerts = []

            # Check for low rate limit alert
            alert_key = self._make_key("alerts", "low_rate_limit")
            alert_value = await redis.get(alert_key)

            if alert_value:
                alerts.append({
                    "type": "low_rate_limit",
                    "message": alert_value
                })

            return alerts

        except Exception as e:
            logger.error(f"Error getting alerts: {e}")
            return []

    async def get_dashboard_data(self) -> Dict[str, Any]:
        """Get comprehensive dashboard data"""
        try:
            # Get various stats in parallel
            today_stats = await self.get_today_stats()
            rate_limit = await self.get_current_rate_limit()
            endpoint_stats = await self.get_endpoint_stats(days=7)
            hourly_stats = await self.get_hourly_stats()
            alerts = await self.get_alerts()

            # Get last 7 days trend
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=6)
            trend = await self.get_stats_range(start_date, end_date)

            return {
                "today": today_stats,
                "rate_limit": rate_limit,
                "endpoint_stats": endpoint_stats,
                "hourly_stats": hourly_stats,
                "alerts": alerts,
                "trend": trend
            }

        except Exception as e:
            logger.error(f"Error getting dashboard data: {e}")
            return {}

    async def clear_old_data(self, days: int = 7):
        """Clear data older than specified days"""
        try:
            redis = await get_redis()
            cutoff_date = datetime.utcnow() - timedelta(days=days)

            # Find and delete old keys
            current_date = cutoff_date
            while current_date < datetime.utcnow():
                date_str = current_date.strftime("%Y%m%d")

                # Delete various keys for this date
                keys_to_delete = [
                    self._make_key("calls", date_str),
                    self._make_key("total", date_str),
                    self._make_key("by_endpoint", date_str),
                    self._make_key("by_method", date_str),
                    self._make_key("by_status", date_str)
                ]

                for key in keys_to_delete:
                    await redis.delete(key)

                current_date += timedelta(days=1)

            logger.info(f"Cleared API usage data older than {days} days")

        except Exception as e:
            logger.error(f"Error clearing old data: {e}")


# Singleton instance
_api_usage_service: Optional[APIUsageService] = None


def get_api_usage_service() -> APIUsageService:
    """Get or create APIUsageService singleton"""
    global _api_usage_service
    if _api_usage_service is None:
        _api_usage_service = APIUsageService()
    return _api_usage_service
