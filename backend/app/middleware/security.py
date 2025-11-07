"""
Security middleware for adding security headers and request tracking
"""

import uuid
import time
import logging
from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

logger = logging.getLogger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all responses
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Add security headers to response

        Args:
            request: Incoming request
            call_next: Next middleware/endpoint handler

        Returns:
            Response with security headers
        """
        response = await call_next(request)

        # Security headers
        security_headers = {
            # Prevent clickjacking attacks
            "X-Frame-Options": "DENY",
            # Prevent MIME type sniffing
            "X-Content-Type-Options": "nosniff",
            # Enable XSS protection
            "X-XSS-Protection": "1; mode=block",
            # Referrer policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            # Content Security Policy (adjust as needed)
            "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
            # Strict Transport Security (HSTS)
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            # Permissions Policy (formerly Feature Policy)
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
        }

        # Add headers to response
        for header, value in security_headers.items():
            response.headers[header] = value

        return response


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add unique request ID to each request for tracking and logging
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Add request ID and log request/response

        Args:
            request: Incoming request
            call_next: Next middleware/endpoint handler

        Returns:
            Response with request ID header
        """
        # Generate unique request ID
        request_id = str(uuid.uuid4())

        # Add request ID to request state for use in endpoints
        request.state.request_id = request_id

        # Get client information
        client_ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown")
        user_agent = request.headers.get("User-Agent", "unknown")

        # Log request
        start_time = time.time()

        logger.info(
            f"Request started: {request.method} {request.url.path} | "
            f"Request ID: {request_id} | "
            f"IP: {client_ip} | "
            f"User-Agent: {user_agent}"
        )

        try:
            # Process request
            response = await call_next(request)

            # Calculate processing time
            process_time = time.time() - start_time

            # Add headers to response
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time"] = str(process_time)

            # Log response
            logger.info(
                f"Request completed: {request.method} {request.url.path} | "
                f"Request ID: {request_id} | "
                f"Status: {response.status_code} | "
                f"Time: {process_time:.3f}s"
            )

            return response

        except Exception as e:
            # Log error
            process_time = time.time() - start_time
            logger.error(
                f"Request failed: {request.method} {request.url.path} | "
                f"Request ID: {request_id} | "
                f"Error: {str(e)} | "
                f"Time: {process_time:.3f}s"
            )
            raise


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware for detailed request/response logging
    """

    def __init__(self, app: ASGIApp):
        super().__init__(app)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Log request and response details

        Args:
            request: Incoming request
            call_next: Next middleware/endpoint handler

        Returns:
            Response object
        """
        # Get request ID from state (set by RequestIDMiddleware)
        request_id = getattr(request.state, "request_id", "unknown")

        # Get client information
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        else:
            client_ip = request.client.host if request.client else "unknown"

        user_agent = request.headers.get("User-Agent", "unknown")

        # Build request info
        request_info = {
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query_params": str(request.query_params),
            "client_ip": client_ip,
            "user_agent": user_agent,
        }

        # Log request details (debug level)
        logger.debug(f"Request details: {request_info}")

        # Process request
        start_time = time.time()

        try:
            response = await call_next(request)
            process_time = time.time() - start_time

            # Log response details
            response_info = {
                "request_id": request_id,
                "status_code": response.status_code,
                "process_time": f"{process_time:.3f}s",
            }

            logger.debug(f"Response details: {response_info}")

            return response

        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"Request error: {request_info} | "
                f"Error: {str(e)} | "
                f"Time: {process_time:.3f}s"
            )
            raise


class CORSHeadersMiddleware(BaseHTTPMiddleware):
    """
    Custom CORS middleware with additional headers
    (Use this if you need custom CORS behavior beyond FastAPI's built-in CORS)
    """

    def __init__(self, app: ASGIApp, allowed_origins: list = None):
        super().__init__(app)
        self.allowed_origins = allowed_origins or ["*"]

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Add CORS headers to response

        Args:
            request: Incoming request
            call_next: Next middleware/endpoint handler

        Returns:
            Response with CORS headers
        """
        # Get origin from request
        origin = request.headers.get("origin")

        # Process request
        response = await call_next(request)

        # Add CORS headers if origin is allowed
        if origin and (self.allowed_origins == ["*"] or origin in self.allowed_origins):
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            response.headers["Access-Control-Max-Age"] = "3600"

        return response
