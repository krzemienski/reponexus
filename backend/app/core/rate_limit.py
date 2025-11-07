"""
Rate limiting utilities using Redis
"""

import time
from typing import Optional, Callable
from functools import wraps
from fastapi import Request, HTTPException, status
from app.core.cache import get_redis
from app.core.config import settings


class RateLimiter:
    """
    Rate limiter using Redis for tracking requests
    """

    def __init__(
        self,
        requests: int = 60,
        window: int = 60,
        key_func: Optional[Callable] = None,
    ):
        """
        Initialize rate limiter

        Args:
            requests: Number of allowed requests
            window: Time window in seconds
            key_func: Function to generate rate limit key from request
        """
        self.requests = requests
        self.window = window
        self.key_func = key_func or self._default_key_func

    @staticmethod
    def _default_key_func(request: Request) -> str:
        """
        Default key function using client IP

        Args:
            request: FastAPI request object

        Returns:
            Rate limit key string
        """
        # Get client IP from X-Forwarded-For header or direct connection
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            ip = forwarded_for.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"

        return f"rate_limit:ip:{ip}"

    async def check_rate_limit(self, request: Request) -> bool:
        """
        Check if request should be rate limited

        Args:
            request: FastAPI request object

        Returns:
            True if rate limit exceeded, False otherwise
        """
        redis_client = await get_redis()
        key = self.key_func(request)

        current_time = int(time.time())
        window_start = current_time - self.window

        # Use Redis sorted set to track requests
        # Remove old requests outside the window
        await redis_client.zremrangebyscore(key, 0, window_start)

        # Count requests in current window
        request_count = await redis_client.zcard(key)

        if request_count >= self.requests:
            return True

        # Add current request
        await redis_client.zadd(key, {str(current_time): current_time})

        # Set expiry on key
        await redis_client.expire(key, self.window)

        return False

    async def get_rate_limit_info(self, request: Request) -> dict:
        """
        Get rate limit information for a request

        Args:
            request: FastAPI request object

        Returns:
            Dictionary with rate limit information
        """
        redis_client = await get_redis()
        key = self.key_func(request)

        current_time = int(time.time())
        window_start = current_time - self.window

        # Remove old requests
        await redis_client.zremrangebyscore(key, 0, window_start)

        # Count requests
        request_count = await redis_client.zcard(key)
        remaining = max(0, self.requests - request_count)

        # Get TTL for reset time
        ttl = await redis_client.ttl(key)
        reset_time = current_time + ttl if ttl > 0 else current_time + self.window

        return {
            "limit": self.requests,
            "remaining": remaining,
            "reset": reset_time,
            "used": request_count,
        }


def rate_limit(
    requests: int = None,
    window: int = 60,
    key_func: Optional[Callable] = None,
):
    """
    Decorator for rate limiting endpoints

    Args:
        requests: Number of allowed requests (default from settings)
        window: Time window in seconds (default 60)
        key_func: Function to generate rate limit key from request

    Example:
        @router.get("/endpoint")
        @rate_limit(requests=10, window=60)
        async def my_endpoint(request: Request):
            ...
    """
    if requests is None:
        requests = settings.RATE_LIMIT_PER_MINUTE

    limiter = RateLimiter(requests=requests, window=window, key_func=key_func)

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Find Request object in args or kwargs
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break

            if not request:
                request = kwargs.get("request")

            if not request:
                raise ValueError("Request object not found in endpoint parameters")

            # Check rate limit
            is_limited = await limiter.check_rate_limit(request)

            if is_limited:
                # Get rate limit info for headers
                info = await limiter.get_rate_limit_info(request)

                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Rate limit exceeded",
                    headers={
                        "X-RateLimit-Limit": str(info["limit"]),
                        "X-RateLimit-Remaining": str(info["remaining"]),
                        "X-RateLimit-Reset": str(info["reset"]),
                        "Retry-After": str(info["reset"] - int(time.time())),
                    },
                )

            # Add rate limit headers to response
            response = await func(*args, **kwargs)

            # Get updated rate limit info
            info = await limiter.get_rate_limit_info(request)

            # If response is a Response object, add headers
            if hasattr(response, "headers"):
                response.headers["X-RateLimit-Limit"] = str(info["limit"])
                response.headers["X-RateLimit-Remaining"] = str(info["remaining"])
                response.headers["X-RateLimit-Reset"] = str(info["reset"])

            return response

        return wrapper

    return decorator


def get_user_rate_limit_key(request: Request) -> str:
    """
    Generate rate limit key based on authenticated user

    Args:
        request: FastAPI request object

    Returns:
        Rate limit key string
    """
    # Try to get user from request state (set by auth middleware)
    user = getattr(request.state, "user", None)

    if user and hasattr(user, "id"):
        return f"rate_limit:user:{user.id}"

    # Fall back to IP-based rate limiting
    return RateLimiter._default_key_func(request)


# Create pre-configured rate limiters
auth_rate_limiter = RateLimiter(requests=10, window=60)  # 10 requests per minute for auth
api_rate_limiter = RateLimiter(requests=60, window=60)  # 60 requests per minute for API
