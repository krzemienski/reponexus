"""
Audit Service for logging authentication and security events
"""

from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from uuid import UUID

from app.models.audit_log import AuditLog
from app.models.user import User


class AuditService:
    """
    Service class for audit logging operations
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def log_event(
        self,
        event_type: str,
        event_status: str,
        user_id: Optional[UUID] = None,
        user_login: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_method: Optional[str] = None,
        request_path: Optional[str] = None,
        event_message: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        """
        Log an audit event

        Args:
            event_type: Type of event (login, logout, token_refresh, etc.)
            event_status: Status of event (success, failure)
            user_id: User's unique identifier
            user_login: User's login username
            ip_address: User's IP address
            user_agent: User's browser/device information
            request_method: HTTP request method
            request_path: HTTP request path
            event_message: Additional message describing the event
            metadata: Additional event-specific data

        Returns:
            Created AuditLog instance
        """
        try:
            audit_log = AuditLog(
                event_type=event_type,
                event_status=event_status,
                user_id=user_id,
                user_login=user_login,
                ip_address=ip_address,
                user_agent=user_agent,
                request_method=request_method,
                request_path=request_path,
                event_message=event_message,
                metadata=metadata,
            )

            self.db.add(audit_log)
            await self.db.commit()
            await self.db.refresh(audit_log)

            return audit_log

        except Exception as e:
            await self.db.rollback()
            # Log error but don't fail the main operation
            print(f"Failed to log audit event: {str(e)}")
            raise

    async def log_login_success(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """
        Log a successful login event

        Args:
            user: User who logged in
            ip_address: User's IP address
            user_agent: User's browser/device information

        Returns:
            Created AuditLog instance
        """
        return await self.log_event(
            event_type="login",
            event_status="success",
            user_id=user.id,
            user_login=user.login,
            ip_address=ip_address,
            user_agent=user_agent,
            event_message=f"User {user.login} logged in successfully",
        )

    async def log_login_failure(
        self,
        reason: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        user_login: Optional[str] = None,
    ) -> AuditLog:
        """
        Log a failed login attempt

        Args:
            reason: Reason for login failure
            ip_address: User's IP address
            user_agent: User's browser/device information
            user_login: Attempted login username

        Returns:
            Created AuditLog instance
        """
        return await self.log_event(
            event_type="login",
            event_status="failure",
            user_login=user_login,
            ip_address=ip_address,
            user_agent=user_agent,
            event_message=f"Login failed: {reason}",
            metadata={"reason": reason},
        )

    async def log_token_refresh(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """
        Log a token refresh event

        Args:
            user: User who refreshed token
            ip_address: User's IP address
            user_agent: User's browser/device information

        Returns:
            Created AuditLog instance
        """
        return await self.log_event(
            event_type="token_refresh",
            event_status="success",
            user_id=user.id,
            user_login=user.login,
            ip_address=ip_address,
            user_agent=user_agent,
            event_message=f"User {user.login} refreshed access token",
        )

    async def log_logout(
        self,
        user: User,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """
        Log a logout event

        Args:
            user: User who logged out
            ip_address: User's IP address
            user_agent: User's browser/device information

        Returns:
            Created AuditLog instance
        """
        return await self.log_event(
            event_type="logout",
            event_status="success",
            user_id=user.id,
            user_login=user.login,
            ip_address=ip_address,
            user_agent=user_agent,
            event_message=f"User {user.login} logged out",
        )

    async def log_unauthorized_access(
        self,
        request_path: str,
        request_method: str,
        reason: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """
        Log an unauthorized access attempt

        Args:
            request_path: Requested path
            request_method: HTTP method used
            reason: Reason for denial
            ip_address: User's IP address
            user_agent: User's browser/device information

        Returns:
            Created AuditLog instance
        """
        return await self.log_event(
            event_type="unauthorized_access",
            event_status="failure",
            ip_address=ip_address,
            user_agent=user_agent,
            request_method=request_method,
            request_path=request_path,
            event_message=f"Unauthorized access attempt: {reason}",
            metadata={"reason": reason},
        )

    async def log_rate_limit_exceeded(
        self,
        ip_address: str,
        request_path: str,
        request_method: str,
        user_id: Optional[UUID] = None,
        user_login: Optional[str] = None,
    ) -> AuditLog:
        """
        Log a rate limit exceeded event

        Args:
            ip_address: User's IP address
            request_path: Requested path
            request_method: HTTP method used
            user_id: User's unique identifier (if authenticated)
            user_login: User's login username (if authenticated)

        Returns:
            Created AuditLog instance
        """
        return await self.log_event(
            event_type="rate_limit_exceeded",
            event_status="failure",
            user_id=user_id,
            user_login=user_login,
            ip_address=ip_address,
            request_method=request_method,
            request_path=request_path,
            event_message=f"Rate limit exceeded for IP {ip_address}",
        )
